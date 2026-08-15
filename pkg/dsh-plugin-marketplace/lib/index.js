// dsh-plugin-marketplace · 宿主半份（host plane）
// 职责：市场目录（内置演示 + 包内预置市场 + 远端 registry + npm 聚合拉取）、本地仓库读取、
// 一键永久安装（用户预设组合 / 技能目录），以及面向浏览器面板的 JSON API 路由。
// 所有网络请求经由宿主 shell 服务 + curl.exe 完成，浏览器端零网络调用。

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUNDLED_DIR = join(HERE, '..', 'bundled')

export const name = 'plugin-marketplace'

export const inject = ['fs', 'agentPresets', 'sandboxPolicy', 'webServer']

const ROUTE_PATH = '/plugin-marketplace/api'

// npm 聚合关键词（启动即后台拉取；只保留与 DSH/DeepSeek Harness 生态相关的包）
const NPM_QUERIES = ['dsh-plugin', 'deepseek-harness']

const DEMO = [
  {
    id: 'session-uptime',
    name: '会话计时器',
    description: '在每次模型步骤的运行时上下文里附上本会话已运行的时长，安装后新建会话即可验证预设插件真实生效。',
    version: '1.0.0',
    author: '示例市场',
    tags: ['演示', '运行时上下文'],
    icon: '⏱️',
    kind: 'preset-plugin',
    source: [
      '// 会话计时器：每次模型步骤的运行时上下文中附上本会话运行时长。',
      'export default {',
      "  name: 'session-uptime',",
      '  apply(ctx) {',
      "    const systemPrompt = ctx.get('systemPrompt')",
      '    if (systemPrompt === undefined) return',
      '    const started = Date.now()',
      '    systemPrompt.context({',
      "      name: 'session-uptime',",
      '      order: 500,',
      '      text: () => {',
      '        const minutes = Math.floor((Date.now() - started) / 60000)',
      "        return '本会话已运行 ' + minutes + ' 分钟。'",
      '      },',
      '    })',
      '  },',
      '}',
    ].join('\n'),
  },
  {
    id: 'now-iso',
    name: '时间工具 now_iso',
    description: '注册一个模型工具 now_iso，返回当前 ISO-8601 时间。演示组合插件如何给 agent 注册新工具。',
    version: '1.0.0',
    author: '示例市场',
    tags: ['演示', '工具'],
    icon: '🕐',
    kind: 'preset-plugin',
    source: [
      '// now_iso：注册一个返回当前时间的模型工具。',
      'export default {',
      "  name: 'now-iso',",
      '  apply(ctx) {',
      "    const tools = ctx.get('tools')",
      '    if (tools === undefined) return',
      '    tools.register({',
      "      name: 'now_iso',",
      "      description: '返回当前本地日期时间（ISO-8601 字符串）。',",
      "      parameters: { type: 'object', properties: {}, required: [] },",
      '      output: {',
      "        schema: { type: 'object', properties: { iso: { type: 'string' } }, required: ['iso'], additionalProperties: false },",
      "        render(args, value) { return [{ type: 'text', text: '当前时间：' + value.iso }] },",
      '      },',
      "      async execute() { return { iso: new Date().toISOString() } },",
      '    })',
      '  },',
      '}',
    ].join('\n'),
  },
  {
    id: 'zh-commit-guide',
    name: '中文提交信息规范',
    description: '安装一个技能：指导编写规范的中文 git 提交信息（type/scope/描述格式）。',
    version: '1.0.0',
    author: '示例市场',
    tags: ['技能', 'git'],
    icon: '📝',
    kind: 'skill',
    content: [
      '# 中文 Git 提交信息规范',
      '',
      '编写提交信息时遵循 Conventional Commits 风格，使用中文描述：',
      '',
      '- 格式：`<type>(<scope>): <一句话描述>`',
      '- type 取值：feat / fix / docs / style / refactor / perf / test / chore / build / ci',
      '- 描述用祈使语气，不超过 72 字符，不要以句号结尾',
      '- 需要补充原因与影响时，用空行分隔后写正文',
      '',
      '示例：',
      '',
      '```',
      'feat(workspace): 支持多工作区切换',
      '',
      '侧边栏增加工作区列表，最近使用的工作区优先展示。',
      '```',
    ].join('\n'),
  },
  {
    id: 'session-tag',
    name: '会话标签（动态试用）',
    description: '以动态插件形式给本会话注入一段运行时上下文标注。演示「立即试用」：下载到工作区后，让助手用 cordis 工具运行。',
    version: '1.0.0',
    author: '示例市场',
    tags: ['演示', '动态插件'],
    icon: '⚡',
    kind: 'dynamic-plugin',
    host: [
      'return {',
      '  apply(ctx) {',
      "    const systemPrompt = ctx.get('systemPrompt')",
      '    if (systemPrompt === undefined) return',
      '    systemPrompt.context({',
      "      name: 'session-tag',",
      '      order: 500,',
      "      text: '本会话由插件市场演示插件 session-tag 标注。',",
      '    })',
      '  },',
      '}',
    ].join('\n'),
    client: null,
  },
]

export function apply(ctx) {
  const fs = ctx.get('fs')
  const web = ctx.get('web')
  const agentPresets = ctx.get('agentPresets')
  const sandboxPolicy = ctx.get('sandboxPolicy')
  const webServer = ctx.get('webServer')
  const shell = ctx.get('shell')

  let catalog = DEMO.slice()
  let registryInfo = null
  const installed = []
  const bundledIds = new Set()
  // 包内预置市场：npm 包里随附的 registry + 插件/技能文件，任何安装方开箱即见
  try {
    const regData = JSON.parse(readFileSync(join(BUNDLED_DIR, 'registry.json'), 'utf8'))
    const regList = Array.isArray(regData) ? regData : (regData && Array.isArray(regData.plugins) ? regData.plugins : [])
    for (const item of regList) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.kind !== 'string' || typeof item.file !== 'string' || item.file === '') continue
      try {
        const text = readFileSync(join(BUNDLED_DIR, item.file), 'utf8')
        if (item.kind === 'preset-plugin' && text !== '') catalog.push({ ...item, source: text })
        else if (item.kind === 'skill' && text !== '') catalog.push({ ...item, content: text })
        else if (item.kind === 'dynamic-plugin') {
          const m = JSON.parse(text)
          if (m && typeof m.host === 'string') catalog.push({ ...item, host: m.host, client: m.client || null })
        } else continue
        bundledIds.add(item.id)
      } catch (e) { /* 跳过坏条目 */ }
    }
  } catch (e) { /* 预置市场缺失或损坏时忽略 */ }
  let netTransport = shell === undefined ? 'none' : 'curl-via-shell'

  // ---------- 工具函数 ----------

  function safeId(id) {
    return String(id).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+/, '').replace(/-+$/, '') || 'plugin'
  }

  function netMsg(err) {
    return String(err && err.message ? err.message : err)
  }

  // 装前源码体检：宿主/预设环境无法解析 npm 依赖，只接受自包含的 ESM 组合插件
  function sourceLooksSafe(src) {
    if (typeof src !== 'string' || src.trim() === '') return { ok: false, error: '源码为空' }
    if (/(require\s*\(|import\s*\()/.test(src)) return { ok: false, error: '源码包含 require/动态 import，宿主与预设环境无法解析外部依赖' }
    if (/import\s+[^'"`]+from\s+['"](?![./])(?!node:)/.test(src)) return { ok: false, error: '源码引用了非相对路径的外部模块（无法解析）' }
    if (!/export\s+default/.test(src)) return { ok: false, error: '源码缺少 export default（不是 DSH 组合插件）' }
    const hasApply = /\bapply\s*\(/.test(src) || /\bapply\s*:/.test(src)
    const isFunctionShape = /export\s+default\s+(function|\w+\s*=>|\(\s*[^)]*\)\s*=>)/.test(src)
    if (!hasApply && !isFunctionShape) return { ok: false, error: '源码缺少 apply 方法（不是可加载的插件）' }
    return { ok: true }
  }

  // 用 node --check 校验语法（宿主有 shell 时）；失败返回错误信息
  async function syntaxCheck(absPath) {
    if (shell === undefined) return { ok: true }
    try {
      const policy = sandboxPolicy !== undefined ? sandboxPolicy.resolve({ mode: 'danger-full-access' }) : undefined
      const spec = shell.resolve({ command: 'node --check "' + String(absPath).replace(/"/g, '') + '"', timeoutMs: 30000, stdoutMaxBytes: 65536, sandboxPolicy: policy })
      const r = await shell.run(spec)
      if (r.exitCode !== 0) {
        const errText = r && r.stderr && typeof r.stderr.text === 'string' ? r.stderr.text : ''
        return { ok: false, error: errText.slice(0, 400) }
      }
      return { ok: true }
    } catch (e) {
      return { ok: true } // 无法校验时放行，交由 mount 校验兜底
    }
  }

  // 从组合 YAML 里移除某一行（用于安装失败回滚）
  async function removeRowFromYml(absPath, rowId) {
    const target = await fs.resolve(absPath, {})
    const current = await fs.readText(target)
    const lines = current.split(/\r?\n/)
    const out = []
    let skipping = false
    for (const line of lines) {
      if (skipping) {
        if (/^[^ \t]/.test(line)) skipping = false
        else continue
      }
      const trimmed = line.trim()
      if (trimmed === '- id: ' + rowId || trimmed.indexOf('- id: ' + rowId + ' ') === 0) { skipping = true; continue }
      out.push(line)
    }
    await writeFile(absPath, out.join('\n'))
  }

  function publicEntry(e) {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      version: e.version,
      author: e.author,
      tags: e.tags || [],
      icon: e.icon || '🧩',
      kind: e.kind,
      fileError: typeof e.fileError === 'string' ? e.fileError : null,
      installed: installed.filter((i) => i.id === e.id).map((i) => ({ status: i.status, message: i.message })),
    }
  }

  // ---------- 网络传输：宿主 shell + curl.exe ----------

  async function httpFetch(url, signal) {
    if (shell === undefined) return { ok: false, statusCode: 0, text: '', error: '宿主没有 shell 服务，无法执行 curl（网络拉取不可用）' }
    const u = String(url).replace(/"/g, '')
    const command = 'curl.exe -sS -L --max-time 25 -w "__CURL_STATUS_END__%{http_code}" "' + u + '"'
    let spec
    try {
      const policy = sandboxPolicy !== undefined ? sandboxPolicy.resolve({ mode: 'danger-full-access' }) : undefined
      spec = shell.resolve({ command, timeoutMs: 32000, stdoutMaxBytes: 2 * 1024 * 1024, signal, sandboxPolicy: policy })
    } catch (e) {
      return { ok: false, statusCode: 0, text: '', error: 'shell.resolve 失败：' + netMsg(e) }
    }
    let result
    try {
      result = await shell.run(spec)
    } catch (e) {
      return { ok: false, statusCode: 0, text: '', error: 'shell.run 失败：' + netMsg(e) }
    }
    const marker = '__CURL_STATUS_END__'
    const raw = result && result.stdout && typeof result.stdout.text === 'string' ? result.stdout.text : ''
    const markerAt = raw.lastIndexOf(marker)
    const text = markerAt >= 0 ? raw.slice(0, markerAt) : raw
    let statusCode = 0
    if (markerAt >= 0) {
      const tail = raw.slice(markerAt + marker.length).trim()
      const code = parseInt(tail.slice(0, 3), 10)
      if (!isNaN(code)) statusCode = code
    }
    const truncated = !!(result && result.stdout && result.stdout.truncated)
    if (result && result.timedOut) return { ok: false, statusCode, text, error: '请求超时（25 秒）' }
    if (result && result.exitCode !== 0 && statusCode === 0) {
      const stderrText = result && result.stderr && typeof result.stderr.text === 'string' ? result.stderr.text : ''
      return { ok: false, statusCode, text, error: 'curl 退出码 ' + result.exitCode + (stderrText ? '：' + stderrText.slice(0, 400) : '') }
    }
    return { ok: true, statusCode, text, truncated, error: null }
  }

  function http2xx(r) {
    return !!(r && r.ok && r.statusCode >= 200 && r.statusCode < 300)
  }

  function resolveUrl(base, rel) {
    if (/^https?:\/\//i.test(String(rel))) return rel
    const clean = String(base).replace(/[?#].*$/, '')
    const idx = clean.lastIndexOf('/')
    return clean.slice(0, idx + 1) + rel
  }

  // ---------- 目录：远端 registry / npm ----------

  function mergeRegistry(url, data, kind) {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.plugins) ? data.plugins : null)
    if (list === null) return { ok: false, error: 'JSON 结构不符合预期：应为插件数组或 { plugins: [...] }' }
    const clean = []
    for (const item of list) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.kind !== 'string') continue
      clean.push(item)
    }
    if (clean.length === 0) return { ok: false, error: '没有解析到任何有效插件条目' }
    const demoIds = new Set(DEMO.map((e) => e.id))
    // 按来源分层保留：npm 拉取只替换旧的 npm 条目；registry 拉取只替换旧的 registry 条目
    if (kind === 'npm') {
      catalog = catalog.filter((e) => demoIds.has(e.id) || bundledIds.has(e.id) || e._registry)
    } else if (kind === 'registry') {
      catalog = catalog.filter((e) => demoIds.has(e.id) || bundledIds.has(e.id) || e._npm)
    } else {
      catalog = catalog.filter((e) => demoIds.has(e.id) || bundledIds.has(e.id))
    }
    for (const item of clean) {
      const idx = catalog.findIndex((e) => e.id === item.id)
      if (idx >= 0) catalog[idx] = item
      else catalog.push(item)
    }
    registryInfo = { url, name: (data && typeof data.name === 'string') ? data.name : url, count: clean.length, error: null }
    return { ok: true, count: clean.length, total: catalog.length }
  }

  // 只保留与 DSH / DeepSeek Harness 生态相关的包，避免把无关 npm 包混进市场
  function relevantDshPkg(p) {
    const name = String(p && p.name ? p.name : '')
    const desc = String(p && p.description ? p.description : '')
    const kws = Array.isArray(p.keywords) ? p.keywords.join(' ') : ''
    const text = name + ' ' + desc + ' ' + kws
    return /dsh|deepseek|create-dsh/i.test(text)
  }

  async function npmPull(query) {
    const q = typeof query === 'string' && query.trim() !== '' ? query.trim() : 'dsh-plugin'
    const searchUrl = 'https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(q) + '&size=20'
    const s = await httpFetch(searchUrl)
    if (!s.ok) return { ok: false, error: 'npm 搜索失败：' + (s.error || '未知错误') }
    if (!http2xx(s)) return { ok: false, error: 'npm 搜索返回 HTTP ' + s.statusCode }
    let data
    try { data = JSON.parse(s.text) } catch (e) { return { ok: false, error: 'npm 搜索返回不是有效 JSON' } }
    const objs = data && Array.isArray(data.objects) ? data.objects : []
    if (objs.length === 0) return { ok: false, error: '没有搜到 npm 包（试试关键词：dsh-plugin / deepseek-harness）' }
    const pkgs = []
    for (const o of objs) {
      const p = o && o.package ? o.package : null
      if (p && typeof p.name === 'string' && typeof p.version === 'string' && relevantDshPkg(p)) pkgs.push(p)
    }
    if (pkgs.length === 0) return { ok: false, error: '关键词「' + q + '」没有搜到相关的 DSH 插件包' }
    const entries = []
    let filtered = 0
    let cursor = 0
    async function worker() {
      while (cursor < pkgs.length) {
        const p = pkgs[cursor]
        cursor += 1
        const url = 'https://cdn.jsdelivr.net/npm/' + encodeURIComponent(p.name) + '@' + encodeURIComponent(p.version)
        const r = await httpFetch(url)
        const base = {
          id: p.name,
          name: p.name,
          description: typeof p.description === 'string' ? p.description : '',
          version: p.version,
          author: p.publisher && p.publisher.username ? p.publisher.username : 'npm',
          tags: Array.isArray(p.keywords) ? p.keywords.slice(0, 5) : [],
          icon: '📦',
          kind: 'preset-plugin',
        }
        if (http2xx(r) && typeof r.text === 'string' && r.text !== '') {
          // 拉取时按插件形状过滤：装不上的包根本不进市场
          const shape = sourceLooksSafe(r.text)
          if (shape.ok) {
            entries.push(Object.assign({}, base, { source: r.text, _npm: true }))
          } else {
            filtered += 1
          }
        } else {
          filtered += 1
        }
      }
    }
    await Promise.all([worker(), worker(), worker()])
    if (entries.length === 0) {
      if (filtered > 0) return { ok: false, error: '关键词「' + q + '」搜到 ' + pkgs.length + ' 个候选，但没有一个是可直接安装的 DSH 组合插件（已过滤）' }
      return { ok: false, error: 'npm 结果为空' }
    }
    const merge = mergeRegistry(searchUrl, { name: 'npm 搜索：' + q, plugins: entries }, 'npm')
    if (!merge.ok) return { ok: false, error: merge.error }
    return { ok: true, count: merge.count, total: merge.total, filtered }
  }

  // 聚合拉取：依次按 NPM_QUERIES 拉取并累积合并，返回汇总
  async function pullAll() {
    let total = 0
    let filtered = 0
    const errors = []
    for (const query of NPM_QUERIES) {
      try {
        const r = await npmPull(query)
        if (r && r.ok) { total += r.count; filtered += r.filtered || 0 }
        else errors.push(r && r.error ? r.error : '未知错误')
      } catch (e) {
        errors.push(String(e && e.message ? e.message : e))
      }
    }
    if (total === 0 && errors.length > 0) return { ok: false, error: errors.join('；') }
    return { ok: true, count: total, total: catalog.length, filtered, queries: NPM_QUERIES.slice() }
  }

  async function registryPull(raw) {
    if (/^npm:/i.test(raw)) return npmPull(raw.slice(4))
    const s = await httpFetch(raw)
    if (!s.ok) return { ok: false, error: '拉取失败：' + (s.error || '未知错误') }
    if (!http2xx(s)) return { ok: false, error: 'registry 返回 HTTP ' + s.statusCode }
    let data
    try { data = JSON.parse(s.text) } catch (e) { return { ok: false, error: '返回内容不是有效 JSON（HTTP ' + s.statusCode + '）' } }
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.plugins) ? data.plugins : null)
    if (list === null) return { ok: false, error: 'JSON 结构不符合预期：应为插件数组或 { plugins: [...] }' }
    const fileEntries = list.filter(function (item) { return item && typeof item === 'object' && typeof item.file === 'string' && item.file !== '' })
    for (const item of fileEntries) {
      item._registry = true
      const r = await httpFetch(resolveUrl(raw, item.file))
      if (!http2xx(r)) { item.fileError = r.ok ? 'HTTP ' + r.statusCode : (r.error || '拉取失败'); continue }
      if (item.kind === 'preset-plugin') item.source = r.text
      else if (item.kind === 'skill') item.content = r.text
      else if (item.kind === 'dynamic-plugin') {
        try {
          const m = JSON.parse(r.text)
          if (m && typeof m.host === 'string') { item.host = m.host; item.client = m.client || null }
        } catch (e) { item.fileError = 'manifest JSON 解析失败' }
      }
    }
    const merge = mergeRegistry(raw, data, 'registry')
    if (!merge.ok) return { ok: false, error: merge.error }
    return merge
  }

  // ---------- 本地仓库（工作区 .plugin-marketplace） ----------

  async function loadLocalEntries(ws) {
    const out = []
    let error = null
    if (fs === undefined || typeof ws !== 'string' || ws === '') return { entries: out, error: '未连接工作区' }
    const dir = ws.replace(/[\\/]+$/, '') + '/.plugin-marketplace'
    try {
      const regTarget = await fs.resolve(dir + '/registry.json', {})
      const data = JSON.parse(await fs.readText(regTarget))
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.plugins) ? data.plugins : [])
      for (const item of list) {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.kind !== 'string' || typeof item.file !== 'string' || item.file === '') continue
        try {
          const fileTarget = await fs.resolve(dir + '/' + item.file, {})
          const text = await fs.readText(fileTarget)
          if (item.kind === 'preset-plugin' && text !== '') out.push({ ...item, source: text })
          else if (item.kind === 'skill' && text !== '') out.push({ ...item, content: text })
          else if (item.kind === 'dynamic-plugin') {
            const m = JSON.parse(text)
            if (m && typeof m.host === 'string') out.push({ ...item, host: m.host, client: m.client || null })
          }
        } catch (e) { /* 跳过坏条目 */ }
      }
    } catch (e) {
      error = String(e && e.message ? e.message : e)
    }
    return { entries: out, error }
  }

  async function findEntryWith(id, ws) {
    if (typeof ws === 'string' && ws !== '') {
      const local = await loadLocalEntries(ws)
      const hit = local.entries.find((e) => e.id === id)
      if (hit !== undefined) return hit
    }
    return catalog.find((e) => e.id === id)
  }

  // ---------- 安装 ----------

  function skillFileContent(entry) {
    const body = typeof entry.content === 'string' ? entry.content : ''
    if (body.indexOf('---') === 0) return body
    return '---\nname: ' + entry.id + '\ndescription: ' + entry.description + '\n---\n\n' + body
  }

  function dshHome() {
    if (typeof process !== 'undefined' && process.env && typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME !== '') return process.env.DSH_HOME
    if (typeof process !== 'undefined' && process.env && typeof process.env.USERPROFILE === 'string') return process.env.USERPROFILE + '/.dsh'
    return ''
  }

  function recordInstalled(id, status, message) {
    installed.push({ id, status, message, ts: Date.now() })
  }

  async function writeFile(absPath, content) {
    const target = await fs.resolve(absPath, {})
    const policy = sandboxPolicy !== undefined ? sandboxPolicy.resolve({ mode: 'danger-full-access' }) : undefined
    await fs.writeText(target, content, undefined, undefined, policy)
  }

  async function readTextFile(absPath) {
    const target = await fs.resolve(absPath, {})
    return fs.readText(target)
  }

  // ---------- 全局安装（宿主补丁层，所有模式的会话都加载） ----------

  async function installGlobal(entry) {
    if (typeof entry.source !== 'string' || entry.source === '') return { ok: false, error: '插件源码缺失（远端 file 拉取失败：' + (entry.fileError || '未知') + '）' }
    const safe = sourceLooksSafe(entry.source)
    if (!safe.ok) return { ok: false, error: '已拒绝安装（' + safe.error + '）：' + entry.id }
    const fid = safeId(entry.id)
    const file = join(HERE, '..', 'global-plugins', fid + '.js')
    await writeFile(file, entry.source)
    // node --check 校验语法，避免把坏源码塞进宿主补丁层
    const check = await syntaxCheck(file)
    if (!check.ok) return { ok: false, error: '插件源码语法校验失败（node --check），已拒绝安装：' + check.error }
    const home = dshHome()
    if (home === '') return { ok: false, error: '无法确定 DSH 主目录（DSH_HOME 未设置）' }
    const patchPath = home.replace(/[\\/]+$/, '') + '/cordis.patch.yml'
    const rowId = 'mp-global-' + fid
    const rowName = 'dsh-plugin-marketplace/plugins/' + fid
    let existing = ''
    try { existing = await readTextFile(patchPath) } catch (e) { existing = '' }
    if (existing.indexOf(rowId) !== -1) {
      recordInstalled(entry.id, 'installed', '全局（宿主补丁层）')
      return { ok: true, message: '插件「' + entry.name + '」已在全局安装列表（宿主补丁层 ' + patchPath + '）。重启 dsh 后所有模式的会话都会加载。' }
    }
    const entryYaml = '- insert:\n    - id: ' + rowId + '\n      name: ' + rowName
    let next
    if (existing === '') {
      next = '# 用户宿主补丁层：机器级偏好，对每个 profile 生效（dsh 实时监听本文件，保存即热加载）\n' + entryYaml + '\n'
    } else if (/\[\s*\]\s*$/.test(existing)) {
      next = existing.replace(/\[\s*\]\s*$/, '') + entryYaml + '\n'
    } else if (/\]\s*$/.test(existing)) {
      next = existing.replace(/\s+$/, '').replace(/\]\s*$/, '') + entryYaml + '\n]\n'
    } else {
      next = existing.replace(/\s+$/, '') + '\n' + entryYaml + '\n'
    }
    await writeFile(patchPath, next)
    recordInstalled(entry.id, 'installed', '全局（宿主补丁层）')
    return {
      ok: true,
      message: '插件「' + entry.name + '」已全局安装：源码写入 ' + file + '，并在宿主补丁层 ' + patchPath + ' 追加一行（id=' + rowId + '）。补丁层被 dsh 实时监听，立即生效：新建会话即可在所有模式使用该插件（若几秒内未生效，重启 dsh 即可）。',
    }
  }

  async function resolveTargetPreset(explicitId) {
    const all = await agentPresets.list()
    if (typeof explicitId === 'string' && explicitId !== '') {
      const found = all.find((p) => p.id === explicitId)
      if (found === undefined) return { error: '预设不存在：' + explicitId }
      if (found.trust !== 'user') return { error: '系统内置预设不可写入：' + explicitId }
      return { preset: found, created: false }
    }
    // 宿主面没有会话上下文：统一安装到「我的插件集」（standard-plugins，不存在则复制 standard）
    const targetId = 'standard-plugins'
    const existing = all.find((p) => p.id === targetId)
    if (existing !== undefined) {
      return existing.trust === 'user' ? { preset: existing, created: false } : { error: '预设 id 冲突：' + targetId }
    }
    try {
      await agentPresets.copy('standard', targetId, '我的插件集')
    } catch (e) {
      return { error: '复制预设失败：' + netMsg(e) }
    }
    const fresh = await agentPresets.list()
    const created = fresh.find((p) => p.id === targetId)
    if (created === undefined) return { error: '复制预设后未能发现新预设：' + targetId }
    return { preset: created, created: true }
  }

  async function installSkill(entry) {
    if (typeof entry.content !== 'string' || entry.content === '') return { ok: false, error: '技能正文缺失（远端 file 拉取失败：' + (entry.fileError || '未知') + '）' }
    const home = dshHome()
    if (home === '') return { ok: false, error: '无法确定 DSH 主目录（DSH_HOME 未设置）' }
    const name = typeof entry.skillName === 'string' && entry.skillName !== '' ? entry.skillName : safeId(entry.id)
    const targetDir = home.replace(/[\\/]+$/, '') + '/skills/' + name
    await writeFile(targetDir + '/SKILL.md', skillFileContent(entry))
    recordInstalled(entry.id, 'installed', '已安装到 ' + targetDir + '/SKILL.md')
    return { ok: true, message: '技能「' + entry.name + '」已永久安装到 ' + targetDir + '/SKILL.md。技能目录会自动刷新可见。' }
  }

  async function installPresetPlugin(entry, presetId) {
    if (typeof entry.source !== 'string' || entry.source === '') return { ok: false, error: '插件源码缺失（远端 file 拉取失败：' + (entry.fileError || '未知') + '）' }
    const safe = sourceLooksSafe(entry.source)
    if (!safe.ok) return { ok: false, error: '已拒绝安装（' + safe.error + '）：' + entry.id }
    const target = await resolveTargetPreset(presetId)
    if (target.error) return { ok: false, error: target.error }
    const preset = target.preset
    const dir = preset.path.replace(/[\\/][^\\/]*$/, '')
    const fid = safeId(entry.id)
    const rowId = 'mp-' + fid
    const file = dir + '/plugins/' + fid + '.js'
    await writeFile(file, entry.source)
    const check = await syntaxCheck(file)
    if (!check.ok) return { ok: false, error: '插件源码语法校验失败（node --check），已拒绝安装：' + check.error }
    const compTarget = await fs.resolve(preset.path, {})
    const current = await fs.readText(compTarget)
    if (current.indexOf(rowId) === -1) {
      const row = '\n- id: ' + rowId + '\n  name: ./plugins/' + fid + '.js\n'
      await writeFile(preset.path, current.replace(/\s+$/, '') + '\n' + row)
    }
    let validation = ''
    try {
      await agentPresets.standingKeyFor(preset.id)
      validation = 'mount 校验通过'
    } catch (e) {
      validation = 'mount 校验失败：' + netMsg(e)
    }
    const okValidation = validation.indexOf('mount 校验通过') === 0
    if (!okValidation) {
      // 回滚：从组合里移除刚加的行，避免一个坏插件拖垮整个预设
      try {
        await removeRowFromYml(preset.path, rowId)
        validation += '（已自动回滚该行，预设已恢复）'
      } catch (e) { validation += '（回滚失败：' + netMsg(e) + '，请手动删除 ' + preset.path + ' 中的 ' + rowId + ' 行）' }
    }
    recordInstalled(entry.id, okValidation ? 'installed' : 'failed', '预设：' + preset.id)
    if (!okValidation) return { ok: false, error: '安装失败：' + validation }
    const createdNote = target.created ? '已创建用户预设「' + preset.id + '」（复制自 standard）。' : ''
    return {
      ok: true,
      presetId: preset.id,
      validation,
      message: '插件「' + entry.name + '」已写入预设 ' + preset.id + '。' + createdNote + validation + '。新建会话并选择预设「' + preset.id + '」后插件即生效。',
    }
  }

  // ---------- 下载 ----------

  async function downloadEntry(entry, ws) {
    if (typeof ws !== 'string' || ws === '') return { ok: false, error: '无法确定工作区路径（请先连接一个工作区）' }
    const base = ws.replace(/[\\/]+$/, '') + '/.plugin-marketplace/downloads/' + safeId(entry.id)
    const files = []
    if (entry.kind === 'preset-plugin') {
      files.push({ rel: 'plugin.js', content: entry.source || '' })
      files.push({ rel: 'manifest.json', content: JSON.stringify(publicEntry(entry), null, 2) })
    } else if (entry.kind === 'skill') {
      files.push({ rel: 'SKILL.md', content: skillFileContent(entry) })
      files.push({ rel: 'manifest.json', content: JSON.stringify(publicEntry(entry), null, 2) })
    } else if (entry.kind === 'dynamic-plugin') {
      files.push({ rel: 'manifest.json', content: JSON.stringify({ id: entry.id, name: entry.name, description: entry.description, host: entry.host, client: entry.client }, null, 2) })
      if (entry.host) files.push({ rel: 'host.js', content: entry.host })
      if (entry.client) files.push({ rel: 'client.js', content: entry.client })
    } else {
      return { ok: false, error: '不支持的条目类型' }
    }
    const written = []
    for (const f of files) {
      await writeFile(base + '/' + f.rel, f.content)
      written.push(base + '/' + f.rel)
    }
    return { ok: true, message: '已下载到工作区：\n' + written.join('\n') }
  }

  // ---------- API 分发 ----------

  async function dispatch(method, args) {
    switch (method) {
      case 'state': {
        let presets = []
        if (agentPresets !== undefined) {
          try {
            presets = (await agentPresets.list()).map((p) => ({ id: p.id, trust: p.trust, name: p.name || p.id }))
          } catch (e) { /* 忽略 */ }
        }
        const ws = args && typeof args.ws === 'string' ? args.ws : ''
        const local = await loadLocalEntries(ws)
        const localIds = new Set(local.entries.map((e) => e.id))
        const demoIds = new Set(DEMO.map((e) => e.id))
        const localRegistry = ws === '' ? null : {
          name: '本地仓库',
          path: ws.replace(/[\\/]+$/, '') + '/.plugin-marketplace/registry.json',
          count: local.entries.length,
          error: local.error,
        }
        const view = catalog.slice()
        for (const item of local.entries) {
          const idx = view.findIndex((e) => e.id === item.id)
          if (idx >= 0) view[idx] = item
          else view.push(item)
        }
        const entries = view.map((e) => {
          const base = publicEntry(e)
          base.source = localIds.has(e.id) ? 'local' : (demoIds.has(e.id) ? 'builtin' : (bundledIds.has(e.id) ? 'bundled' : 'remote'))
          return base
        })
        return {
          ok: true,
          entries,
          registry: registryInfo,
          localRegistry,
          installed: installed.slice(),
          presets,
          net: { transport: netTransport, available: shell !== undefined },
          dshHome: dshHome(),
        }
      }
      case 'npm-pull': {
        const query = args && typeof args.query === 'string' ? args.query.trim() : ''
        return query === '' ? pullAll() : npmPull(query)
      }
      case 'registry-pull': {
        const raw = args && typeof args.url === 'string' ? args.url.trim() : ''
        if (raw === '') return { ok: false, error: '请输入 registry JSON 地址或 npm:搜索词' }
        return registryPull(raw)
      }
      case 'install': {
        const entry = await findEntryWith(args && args.id, args && args.ws)
        if (entry === undefined) return { ok: false, error: '未知插件：' + (args && args.id) }
        const target = args && typeof args.target === 'string' ? args.target.trim() : ''
        if (target === 'global') {
          if (entry.kind !== 'preset-plugin') return { ok: false, error: '技能本身就装进全局技能目录（所有模式可用），无需选择全局；仅组合插件支持全局安装' }
          return installGlobal(entry)
        }
        if (entry.kind === 'preset-plugin') return installPresetPlugin(entry, target !== '' ? target : (args && args.presetId))
        if (entry.kind === 'skill') return installSkill(entry)
        return { ok: false, error: '该条目类型不支持直接安装（动态试用请用「下载到工作区」）' }
      }
      case 'get-source': {
        const entry = await findEntryWith(args && args.id, args && args.ws)
        if (entry === undefined) return { ok: false, error: '未知插件：' + (args && args.id) }
        if (entry.kind === 'preset-plugin') return { ok: true, source: entry.source, label: '组合插件源码（ESM 文件）' }
        if (entry.kind === 'skill') return { ok: true, source: skillFileContent(entry), label: '技能正文（SKILL.md）' }
        if (entry.kind === 'dynamic-plugin') {
          return { ok: true, source: JSON.stringify({ name: entry.name, description: entry.description, host: entry.host, client: entry.client }, null, 2), label: '动态插件 manifest（host/client 函数体）' }
        }
        return { ok: false, error: '不支持的条目类型' }
      }
      case 'download': {
        const entry = await findEntryWith(args && args.id, args && args.ws)
        if (entry === undefined) return { ok: false, error: '未知插件：' + (args && args.id) }
        return downloadEntry(entry, args && args.ws)
      }
      default:
        return { ok: false, error: '未知方法：' + method }
    }
  }

  // ---------- 生命周期 ----------

  // 宿主面注册一个诊断工具：验证宿主面工具是否能进入各模式会话的工具表
  const tools = ctx.get('tools')
  if (tools !== undefined) {
    try {
      tools.register({
        name: 'marketplace_ping',
        description: '测试插件市场的远端抓取能力：通过宿主 shell 调用 curl 请求一个 URL，返回 HTTP 状态码与内容长度。',
        parameters: {
          type: 'object',
          properties: { url: { type: 'string', description: '要测试的 URL。' } },
          required: ['url'],
        },
        output: {
          schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' }, statusCode: { type: 'number' }, bytes: { type: 'number' } }, required: ['ok', 'message'], additionalProperties: false },
          render(args, value) { return [{ type: 'text', text: value.message }] },
        },
        async execute(args) {
          const r = await httpFetch(String(args && args.url ? args.url : ''))
          if (!r.ok) return { ok: false, message: '抓取失败：' + (r.error || '未知错误') }
          const bytes = typeof r.text === 'string' ? r.text.length : 0
          return { ok: true, statusCode: r.statusCode, bytes, message: 'HTTP ' + r.statusCode + '，内容长度 ' + bytes + ' 字节（宿主 curl 传输）' }
        },
      })
    } catch (e) { /* 名称冲突或不可用，忽略 */ }
  }

  // 把宿主 curl 传输注册为 web 服务的 fetch 提供商，web.fetch 从此可用
  if (web !== undefined) {
    try {
      web.registerFetchProvider({
        id: 'plugin-marketplace-curl',
        available() { return shell !== undefined },
        async fetch(request, signal) {
          const r = await httpFetch(request.url, signal)
          if (!r.ok) throw new Error(r.error || '拉取失败')
          return { url: request.url, statusCode: r.statusCode || 0, body: { kind: 'text', content: r.text || '' }, truncated: !!r.truncated }
        },
      })
      netTransport = 'web.fetch(plugin-marketplace-curl)'
    } catch (e) { /* 已注册或不可用，忽略 */ }
  }

  if (webServer !== undefined) {
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: ROUTE_PATH,
      handler: async (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
          return
        }
        let url
        try { url = new URL(req.url || '/', 'http://localhost') } catch (e) {
          res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, error: 'bad request' }))
          return
        }
        const method = url.searchParams.get('m') || 'state'
        const args = {}
        for (const [k, v] of url.searchParams.entries()) if (k !== 'm') args[k] = v
        let payload
        try {
          payload = await dispatch(method, args)
        } catch (error) {
          payload = { ok: false, error: String(error && error.message ? error.message : error) }
        }
        const body = JSON.stringify(payload)
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-cache',
          'content-length': Buffer.byteLength(body),
        })
        res.end(body)
      },
    }), 'plugin-marketplace: /plugin-marketplace/api 路由')
  }

  // 启动即后台预拉 npm 插件库（多关键词聚合）：面板第一次打开时目录已经就绪（失败静默，面板可手动重拉）
  if (shell !== undefined) {
    pullAll().catch(function (e) { /* 预拉失败，忽略；面板可手动重试 */ })
  }
}
