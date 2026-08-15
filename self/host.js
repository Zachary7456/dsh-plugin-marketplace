return {
  apply(ctx) {
    const fs = ctx.get('fs')
    const web = ctx.get('web')
    const agentPresets = ctx.get('agentPresets')
    const systemPrompt = ctx.get('systemPrompt')
    const approval = ctx.get('approval')
    const sandboxPolicy = ctx.get('sandboxPolicy')
    const agents = ctx.get('agents')
    const workspaceRegistry = ctx.get('workspaceRegistry')
    const shell = ctx.get('shell')

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
        description: '以动态插件形式给本会话注入一段运行时上下文标注。演示「立即试用」：只在本会话生效，重启即消失。',
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

    let catalog = DEMO.slice()
    let registryInfo = null
    const pending = []
    const installed = []
    let netTransport = shell === undefined ? 'none' : 'curl-via-shell'

    // ---- 网络传输：宿主 shell + curl.exe（客户端没有网络能力，全部走这里） ----
    function netMsg(err) {
      return String(err && err.message ? err.message : err)
    }

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

    async function npmPull(query) {
      const q = typeof query === 'string' && query.trim() !== '' ? query.trim() : 'dsh-plugin'
      const searchUrl = 'https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(q) + '&size=10'
      const s = await httpFetch(searchUrl)
      if (!s.ok) return { ok: false, error: 'npm 搜索失败：' + (s.error || '未知错误') }
      if (!http2xx(s)) return { ok: false, error: 'npm 搜索返回 HTTP ' + s.statusCode }
      let data
      try { data = JSON.parse(s.text) } catch (e) { return { ok: false, error: 'npm 搜索返回不是有效 JSON' } }
      const objs = data && Array.isArray(data.objects) ? data.objects : []
      if (objs.length === 0) return { ok: false, error: '没有搜到 npm 包（试试关键词：dsh-plugin / dsh）' }
      const pkgs = []
      for (const o of objs) {
        const p = o && o.package ? o.package : null
        if (p && typeof p.name === 'string' && typeof p.version === 'string') pkgs.push(p)
      }
      if (pkgs.length === 0) return { ok: false, error: 'npm 搜索没有返回任何包信息' }
      const entries = []
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
            entries.push(Object.assign({}, base, { source: r.text }))
          } else {
            entries.push(Object.assign({}, base, { fileError: r.ok ? 'jsdelivr HTTP ' + r.statusCode : (r.error || 'jsdelivr 拉取失败') }))
          }
        }
      }
      await Promise.all([worker(), worker(), worker()])
      if (entries.length === 0) return { ok: false, error: 'npm 结果为空' }
      const merge = mergeRegistry(searchUrl, { name: 'npm 搜索：' + q, plugins: entries })
      if (!merge.ok) return { ok: false, error: merge.error }
      return { ok: true, count: merge.count, total: merge.total, failed: entries.filter(function (e) { return e.fileError }).length }
    }

    function safeId(id) {
      return String(id).replace(/[^a-zA-Z0-9_-]+/g, '-')
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
        pending: pending.some((p) => p.id === e.id),
        installed: installed.filter((i) => i.id === e.id).map((i) => ({ status: i.status, message: i.message })),
      }
    }

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
      const local = await loadLocalEntries(ws)
      const hit = local.entries.find((e) => e.id === id)
      if (hit !== undefined) return hit
      return catalog.find((e) => e.id === id)
    }

    function skillFileContent(entry) {
      const body = typeof entry.content === 'string' ? entry.content : ''
      if (body.indexOf('---') === 0) return body
      return '---\nname: ' + entry.id + '\ndescription: ' + entry.description + '\n---\n\n' + body
    }

    function pendingText() {
      if (pending.length === 0) return ''
      const lines = ['[插件市场] 存在待处理的安装请求：']
      for (const p of pending) {
        if (p.kind === 'install') {
          lines.push('- 永久安装「' + p.name + '」(id=' + p.id + ')：调用工具 marketplace_install，参数 pluginId="' + p.id + '"、workspace="' + (p.ws || '') + '"（技能类记得传 dshHome）。')
        } else {
          lines.push('- 立即试用「' + p.name + '」(id=' + p.id + ')：先调用工具 marketplace_prepare，参数 pluginId="' + p.id + '"、workspace="' + (p.ws || '') + '" 把源码写入工作区；然后读取 manifest.json，用 cordis_define 定义并 cordis_run 运行；最后调用 marketplace_report 汇报结果（pluginId/status/message）。')
        }
      }
      lines.push('完成或失败后，把结果用中文简要告诉用户。')
      return lines.join('\n')
    }
    if (systemPrompt !== undefined) {
      systemPrompt.context({ name: 'plugin-marketplace-pending', order: 0, text: pendingText })
    }

    function sessionWs(exec) {
      const session = exec.agent ? exec.agent.session : undefined
      if (session === undefined) return ''
      if (session.meta && typeof session.meta.cwd === 'string' && session.meta.cwd !== '') return session.meta.cwd
      if (typeof session.cwd === 'string' && session.cwd !== '') return session.cwd
      return ''
    }

    function registryWs() {
      if (workspaceRegistry === undefined) return ''
      try {
        const list = workspaceRegistry.list()
        if (list.length > 0 && list[0] && typeof list[0].path === 'string') return list[0].path
      } catch (e) { /* 忽略 */ }
      return ''
    }

    function resolveWs(args, exec) {
      if (args && typeof args.workspace === 'string' && args.workspace !== '') return args.workspace
      const fromSession = sessionWs(exec)
      if (fromSession !== '') return fromSession
      return registryWs()
    }

    function pickPolicy(wsPath) {
      if (sandboxPolicy === undefined) return undefined
      if (agents !== undefined && typeof wsPath === 'string' && wsPath !== '') {
        const norm = wsPath.toLowerCase()
        for (const agent of agents.list()) {
          try {
            const policy = sandboxPolicy.resolve({ session: agent.session })
            if (policy.workspaceRoot && norm.startsWith(String(policy.workspaceRoot).toLowerCase())) return policy
          } catch (e) { /* 下一个 */ }
        }
      }
      try { return sandboxPolicy.resolve({}) } catch (e) { return undefined }
    }

    async function writeEscalated(absPath, content, exec) {
      const target = await fs.resolve(absPath, {})
      const session = exec.agent ? exec.agent.session : undefined
      const policy = sandboxPolicy !== undefined && session !== undefined ? sandboxPolicy.resolve({ session }) : undefined
      try {
        await fs.writeText(target, content, undefined, exec.signal, policy)
      } catch (error) {
        if (approval === undefined || exec.agent === undefined) throw error
        const outcome = await approval.request({
          agent: exec.agent,
          toolName: 'marketplace_install',
          callId: exec.callId,
          reason: '插件市场要把插件文件写入用户预设目录：' + absPath,
          signal: exec.signal,
        })
        if (outcome !== 'allowed-once') {
          throw new Error('用户未批准文件写入授权（结果：' + outcome + '），安装已取消')
        }
        const wider = sandboxPolicy !== undefined ? sandboxPolicy.resolve({ session, mode: 'danger-full-access' }) : undefined
        await fs.writeText(target, content, undefined, exec.signal, wider)
      }
    }

    async function resolveTargetPreset(explicitId, agent) {
      const all = await agentPresets.list()
      if (typeof explicitId === 'string' && explicitId !== '') {
        const found = all.find((p) => p.id === explicitId)
        if (found === undefined) return { error: '预设不存在：' + explicitId }
        if (found.trust !== 'user') return { error: '系统内置预设不可写入：' + explicitId + '。请在面板选择或新建用户预设。' }
        return { preset: found, created: false }
      }
      let currentId
      if (agent !== undefined) {
        try { currentId = agentPresets.composedPreset(agent.ctx) || undefined } catch (e) { /* 忽略 */ }
      }
      const current = currentId === undefined ? undefined : all.find((p) => p.id === currentId)
      if (current !== undefined && current.trust === 'user') return { preset: current, created: false }
      // cordis 预设带进程级 Inspect 提供商，不能复制成第二份；自动复制一律基于 standard
      const baseId = current !== undefined && current.id !== 'cordis' ? current.id : 'standard'
      const targetId = baseId + '-plugins'
      const existing = all.find((p) => p.id === targetId)
      if (existing !== undefined) {
        return existing.trust === 'user' ? { preset: existing, created: false } : { error: '预设 id 冲突：' + targetId }
      }
      try {
        await agentPresets.copy(baseId, targetId, '我的插件集')
      } catch (e) {
        return { error: '复制预设失败：' + String(e && e.message ? e.message : e) }
      }
      const fresh = await agentPresets.list()
      const created = fresh.find((p) => p.id === targetId)
      if (created === undefined) return { error: '复制预设后未能发现新预设：' + targetId }
      return { preset: created, created: true }
    }

    function removePending(id) {
      const idx = pending.findIndex((p) => p.id === id)
      if (idx >= 0) pending.splice(idx, 1)
    }

    const toolPrepare = harness.defineTool({
      name: 'marketplace_prepare',
      description: '把插件市场里待试用插件（dynamic-plugin）的源码写入当前会话工作区的 .plugin-marketplace/pending/<id>/，返回 manifest.json 路径与内容摘要，供 cordis_define 使用。',
      parameters: {
        type: 'object',
        properties: {
          pluginId: { type: 'string', description: '市场目录中的插件 id。' },
          workspace: { type: 'string', description: '可选：工作区绝对路径；省略时自动推断。' },
        },
        required: ['pluginId'],
      },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean', required: true }, message: { type: 'string', required: true }, manifestPath: { type: 'string' } }, additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args, exec) {
        const ws = resolveWs(args, exec)
        if (ws === '') return { ok: false, message: '无法确定会话工作区' }
        const entry = await findEntryWith(args.pluginId, ws)
        if (entry === undefined) return { ok: false, message: '未知插件：' + args.pluginId }
        if (entry.kind !== 'dynamic-plugin') return { ok: false, message: '该条目不是动态插件' }
        if (typeof entry.host !== 'string' || entry.host === '') return { ok: false, message: '插件源码缺失（远端 file 拉取失败：' + (entry.fileError || '未知') + '）' }
        if (fs === undefined) return { ok: false, message: '没有文件系统服务' }
        const base = ws.replace(/[\\/]+$/, '') + '/.plugin-marketplace/pending/' + safeId(entry.id)
        const session = exec.agent ? exec.agent.session : undefined
        const policy = sandboxPolicy !== undefined && session !== undefined ? sandboxPolicy.resolve({ session }) : undefined
        try {
          const manifest = { id: entry.id, name: entry.name, description: entry.description, host: entry.host, client: entry.client }
          const t1 = await fs.resolve(base + '/manifest.json', { cwd: ws })
          await fs.writeText(t1, JSON.stringify(manifest, null, 2), undefined, exec.signal, policy)
          if (entry.host) {
            const t2 = await fs.resolve(base + '/host.js', { cwd: ws })
            await fs.writeText(t2, entry.host, undefined, exec.signal, policy)
          }
          if (entry.client) {
            const t3 = await fs.resolve(base + '/client.js', { cwd: ws })
            await fs.writeText(t3, entry.client, undefined, exec.signal, policy)
          }
          return { ok: true, manifestPath: base + '/manifest.json', message: '源码已写入 ' + base + '。请读取 manifest.json 后用 cordis_define 定义、cordis_run 运行。' }
        } catch (error) {
          return { ok: false, message: '写入失败：' + String(error && error.message ? error.message : error) }
        }
      },
    })
    harness.registerTool(ctx, toolPrepare)

    const toolInstall = harness.defineTool({
      name: 'marketplace_install',
      description: '把插件市场目录中的插件永久安装：preset-plugin 写入用户预设组合（plugins/<id>.js + agent.cordis.yml 追加行，并做 mount 校验）；skill 写入 DSH 主目录 skills/<name>/SKILL.md。默认目标：当前会话预设（系统预设会先复制成用户预设副本；cordis 预设自动改用 standard 基底）。写文件可能需要用户批准一次授权。',
      parameters: {
        type: 'object',
        properties: {
          pluginId: { type: 'string', description: '市场目录中的插件 id。' },
          presetId: { type: 'string', description: '可选：目标用户预设 id。省略时自动选择当前预设（或它的副本）。' },
          dshHome: { type: 'string', description: '可选：DSH 主目录绝对路径（如 C:/Users/<you>/.dsh），安装技能时必需。' },
          workspace: { type: 'string', description: '可选：工作区绝对路径（用于定位本地仓库条目）；省略时自动推断。' },
        },
        required: ['pluginId'],
      },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean', required: true }, message: { type: 'string', required: true }, presetId: { type: 'string' }, validation: { type: 'string' } }, additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message + (value.validation ? '\n' + value.validation : '') }] },
      },
      async execute(args, exec) {
        const ws = resolveWs(args, exec)
        const entry = await findEntryWith(args.pluginId, ws)
        if (entry === undefined) return { ok: false, message: '未知插件：' + args.pluginId }
        if (entry.kind !== 'preset-plugin' && entry.kind !== 'skill') return { ok: false, message: '该条目类型不支持永久安装' }
        if (fs === undefined || agentPresets === undefined) return { ok: false, message: '缺少文件系统或预设服务，无法安装' }
        try {
          if (entry.kind === 'skill') {
            if (typeof entry.content !== 'string' || entry.content === '') return { ok: false, message: '技能正文缺失（远端 file 拉取失败：' + (entry.fileError || '未知') + '）' }
            const name = typeof entry.skillName === 'string' && entry.skillName !== '' ? entry.skillName : safeId(entry.id)
            const home = typeof args.dshHome === 'string' && args.dshHome !== '' ? args.dshHome : ''
            if (home === '') return { ok: false, message: '技能安装需要 dshHome 参数（DSH 主目录，例如 C:/Users/<you>/.dsh）' }
            const targetDir = home.replace(/[\\/]+$/, '') + '/skills/' + name
            await writeEscalated(targetDir + '/SKILL.md', skillFileContent(entry), exec)
            removePending(entry.id)
            installed.push({ id: entry.id, status: 'installed', message: '已安装到 ' + targetDir + '/SKILL.md', ts: Date.now() })
            return { ok: true, message: '技能「' + entry.name + '」已永久安装到 ' + targetDir + '/SKILL.md。技能目录会在后续步骤刷新后可见。' }
          }
          if (typeof entry.source !== 'string' || entry.source === '') return { ok: false, message: '插件源码缺失（远端 file 拉取失败：' + (entry.fileError || '未知') + '）' }
          const target = await resolveTargetPreset(args.presetId, exec.agent)
          if (target.error) return { ok: false, message: target.error }
          const preset = target.preset
          const dir = preset.path.replace(/[\\/][^\\/]*$/, '')
          const fid = safeId(entry.id)
          const rowId = 'mp-' + fid
          await writeEscalated(dir + '/plugins/' + fid + '.js', entry.source, exec)
          const compTarget = await fs.resolve(preset.path, {})
          const current = await fs.readText(compTarget)
          const row = '\n- id: ' + rowId + '\n  name: ./plugins/' + fid + '.js\n'
          await writeEscalated(preset.path, current.replace(/\s+$/, '') + '\n' + row, exec)
          let validation = ''
          try {
            await agentPresets.standingKeyFor(preset.id)
            validation = 'mount 校验通过'
          } catch (e) {
            validation = 'mount 校验失败：' + String(e && e.message ? e.message : e)
          }
          removePending(entry.id)
          const okValidation = validation.indexOf('mount 校验通过') === 0
          installed.push({ id: entry.id, status: okValidation ? 'installed' : 'installed-with-warning', message: '预设：' + preset.id, ts: Date.now() })
          const createdNote = target.created ? '已创建用户预设「' + preset.id + '」（复制自 standard）。' : ''
          return {
            ok: true,
            presetId: preset.id,
            validation,
            message: '插件「' + entry.name + '」已写入预设 ' + preset.id + '。' + createdNote + validation + '。新建会话并选择预设「' + preset.id + '」后插件即生效。',
          }
        } catch (error) {
          const msg = String(error && error.message ? error.message : error)
          removePending(entry.id)
          installed.push({ id: entry.id, status: 'failed', message: msg, ts: Date.now() })
          return { ok: false, message: '安装失败：' + msg }
        }
      },
    })
    harness.registerTool(ctx, toolInstall)

    const toolReport = harness.defineTool({
      name: 'marketplace_report',
      description: '汇报插件市场待处理请求的结果（例如临时试用完成后），清除待处理状态并记录到已安装列表。',
      parameters: {
        type: 'object',
        properties: {
          pluginId: { type: 'string', description: '市场目录中的插件 id。' },
          status: { type: 'string', description: 'installed 或 failed。' },
          message: { type: 'string', description: '一句话结果说明。' },
        },
        required: ['pluginId', 'status', 'message'],
      },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean', required: true } }, additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.ok ? '已记录' : '未找到待处理条目' }] },
      },
      async execute(args) {
        const idx = pending.findIndex((p) => p.id === args.pluginId)
        if (idx >= 0) pending.splice(idx, 1)
        installed.push({ id: args.pluginId, status: args.status === 'failed' ? 'failed' : 'installed', message: args.message || '', ts: Date.now() })
        return { ok: idx >= 0 }
      },
    })
    harness.registerTool(ctx, toolReport)

    const toolPing = harness.defineTool({
      name: 'marketplace_ping',
      description: '测试插件市场的远端抓取能力：通过宿主 shell 调用 curl 请求一个 URL，返回 HTTP 状态码与内容长度，用于验证 GitHub/npm 等远端仓库是否可达。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '要测试的 URL。' },
        },
        required: ['url'],
      },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean', required: true }, message: { type: 'string', required: true }, statusCode: { type: 'number' }, bytes: { type: 'number' } }, additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args) {
        const r = await httpFetch(String(args && args.url ? args.url : ''))
        if (!r.ok) return { ok: false, message: '抓取失败：' + (r.error || '未知错误') }
        const bytes = typeof r.text === 'string' ? r.text.length : 0
        return { ok: true, statusCode: r.statusCode, bytes, message: 'HTTP ' + r.statusCode + '，内容长度 ' + bytes + ' 字节（宿主 curl 传输）' }
      },
    })
    harness.registerTool(ctx, toolPing)

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

    function mergeRegistry(url, data) {
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.plugins) ? data.plugins : null)
      if (list === null) return { ok: false, error: 'JSON 结构不符合预期：应为插件数组或 { plugins: [...] }' }
      const clean = []
      for (const item of list) {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.kind !== 'string') continue
        clean.push(item)
      }
      if (clean.length === 0) return { ok: false, error: '没有解析到任何有效插件条目' }
      const demoIds = new Set(DEMO.map((e) => e.id))
      catalog = catalog.filter((e) => demoIds.has(e.id))
      for (const item of clean) {
        const idx = catalog.findIndex((e) => e.id === item.id)
        if (idx >= 0) catalog[idx] = item
        else catalog.push(item)
      }
      registryInfo = { url, name: (data && typeof data.name === 'string') ? data.name : url, count: clean.length, error: null }
      return { ok: true, count: clean.length, total: catalog.length }
    }

    harness.handle('state', async (args) => {
      let presets = []
      if (agentPresets !== undefined) {
        try {
          presets = (await agentPresets.list()).map((p) => ({ id: p.id, trust: p.trust, name: p.name || p.id }))
        } catch (e) { /* 忽略 */ }
      }
      const ws = args && typeof args.workspace === 'string' ? args.workspace : ''
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
        base.source = localIds.has(e.id) ? 'local' : (demoIds.has(e.id) ? 'builtin' : 'remote')
        return base
      })
      return {
        entries,
        registry: registryInfo,
        localRegistry,
        pending: pending.slice(),
        installed: installed.slice(),
        presets,
        net: { transport: netTransport, available: shell !== undefined },
      }
    })

    harness.handle('set-registry', async (args) => {
      const url = args && typeof args.url === 'string' ? args.url.trim() : ''
      if (url === '') return { ok: false, error: '请输入 registry JSON 地址' }
      if (web === undefined) return { ok: false, error: '当前运行时没有网页抓取服务' }
      try {
        const result = await web.fetch({ url })
        const body = result && result.body ? result.body.content : ''
        let data
        try { data = JSON.parse(body) } catch (e) {
          return { ok: false, error: '返回内容不是有效 JSON（HTTP ' + (result ? result.statusCode : '?') + '）' }
        }
        return mergeRegistry(url, data)
      } catch (error) {
        const msg = String(error && error.message ? error.message : error)
        registryInfo = { url, name: url, count: 0, error: msg }
        return { ok: false, error: msg }
      }
    })

    harness.handle('set-registry-json', async (args) => {
      const url = args && typeof args.url === 'string' ? args.url.trim() : ''
      const data = args && args.json ? args.json : null
      if (url === '') return { ok: false, error: '缺少 registry 地址' }
      if (data === null) return { ok: false, error: '缺少已解析的 JSON 数据' }
      return mergeRegistry(url, data)
    })

    // npm 自动拉取：搜索 + jsdelivr 抓包（全部在宿主完成，客户端只显示结果）
    harness.handle('npm-pull', async (args) => npmPull(args && args.query))

    // registry 拉取：抓 registry JSON + 逐个抓取相对 file（全部在宿主完成）
    harness.handle('registry-pull', async (args) => {
      const raw = args && typeof args.url === 'string' ? args.url.trim() : ''
      if (raw === '') return { ok: false, error: '请输入 registry JSON 地址或 npm:搜索词' }
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
      const merge = mergeRegistry(raw, data)
      if (!merge.ok) return { ok: false, error: merge.error }
      return merge
    })

    harness.handle('request-install', async (args) => {
      const ws = args && typeof args.workspace === 'string' ? args.workspace : ''
      const entry = await findEntryWith(args && args.id, ws)
      if (entry === undefined) return { ok: false, message: '未知插件：' + (args && args.id) }
      if (entry.kind !== 'preset-plugin' && entry.kind !== 'skill') return { ok: false, message: '该条目类型不支持永久安装' }
      if (pending.some((p) => p.id === entry.id)) return { ok: false, message: '该插件已在待处理队列中' }
      pending.push({ id: entry.id, name: entry.name, kind: 'install', ts: Date.now(), ws })
      return { ok: true, message: '「' + entry.name + '」已加入安装队列。请在对话框发送任意消息（例如「继续安装」），助手将完成永久安装。' }
    })

    harness.handle('request-try', async (args) => {
      const ws = args && typeof args.workspace === 'string' ? args.workspace : ''
      const entry = await findEntryWith(args && args.id, ws)
      if (entry === undefined) return { ok: false, message: '未知插件：' + (args && args.id) }
      if (entry.kind !== 'dynamic-plugin') return { ok: false, message: '该条目不是动态插件，无法立即试用' }
      if (pending.some((p) => p.id === entry.id)) return { ok: false, message: '该插件已在待处理队列中' }
      pending.push({ id: entry.id, name: entry.name, kind: 'try', ts: Date.now(), ws })
      return { ok: true, message: '「' + entry.name + '」已加入试用队列。发送任意消息后，助手会在当前会话临时运行它。' }
    })

    harness.handle('get-source', async (args) => {
      const ws = args && typeof args.workspace === 'string' ? args.workspace : ''
      const entry = await findEntryWith(args && args.id, ws)
      if (entry === undefined) return { ok: false, message: '未知插件：' + (args && args.id) }
      if (entry.kind === 'preset-plugin') return { ok: true, source: entry.source, label: '组合插件源码（ESM 文件）' }
      if (entry.kind === 'skill') return { ok: true, source: skillFileContent(entry), label: '技能正文（SKILL.md）' }
      if (entry.kind === 'dynamic-plugin') {
        return { ok: true, source: JSON.stringify({ name: entry.name, description: entry.description, host: entry.host, client: entry.client }, null, 2), label: '动态插件 manifest（host/client 函数体）' }
      }
      return { ok: false, message: '不支持的条目类型' }
    })

    harness.handle('download', async (args) => {
      const ws = args && typeof args.workspace === 'string' ? args.workspace : ''
      if (ws === '') return { ok: false, message: '无法确定工作区路径（请先连接一个工作区）' }
      const entry = await findEntryWith(args && args.id, ws)
      if (entry === undefined) return { ok: false, message: '未知插件：' + (args && args.id) }
      if (fs === undefined) return { ok: false, message: '没有文件系统服务' }
      const base = ws.replace(/[\\/]+$/, '') + '/.plugin-marketplace/downloads/' + safeId(entry.id)
      const policy = pickPolicy(ws)
      try {
        const files = []
        if (entry.kind === 'preset-plugin') {
          files.push({ rel: 'plugin.js', content: entry.source })
          files.push({ rel: 'manifest.json', content: JSON.stringify(publicEntry(entry), null, 2) })
        } else if (entry.kind === 'skill') {
          files.push({ rel: 'SKILL.md', content: skillFileContent(entry) })
          files.push({ rel: 'manifest.json', content: JSON.stringify(publicEntry(entry), null, 2) })
        } else if (entry.kind === 'dynamic-plugin') {
          files.push({ rel: 'manifest.json', content: JSON.stringify({ id: entry.id, name: entry.name, description: entry.description, host: entry.host, client: entry.client }, null, 2) })
          if (entry.host) files.push({ rel: 'host.js', content: entry.host })
          if (entry.client) files.push({ rel: 'client.js', content: entry.client })
        } else {
          return { ok: false, message: '不支持的条目类型' }
        }
        const written = []
        for (const f of files) {
          const target = await fs.resolve(base + '/' + f.rel, {})
          await fs.writeText(target, f.content, undefined, undefined, policy)
          written.push(base + '/' + f.rel)
        }
        return { ok: true, message: '已下载到工作区：\n' + written.join('\n') }
      } catch (error) {
        return { ok: false, message: '下载失败：' + String(error && error.message ? error.message : error) }
      }
    })
  },
}
