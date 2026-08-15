return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    const autoState = { pulled: false }

    styles.insert([
      '.mp-panel-root { position: fixed; inset: 0; pointer-events: none; z-index: 9990; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }',
      '.mp-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.28); pointer-events: auto; }',
      '.mp-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 384px; max-width: 92vw; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); border-left: 1px solid var(--dsw-alias-border-l1); box-shadow: -12px 0 32px rgba(0,0,0,0.18); pointer-events: auto; }',
      '.mp-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); }',
      '.mp-title { font-size: 15px; font-weight: 600; flex: 1; }',
      '.mp-close { border: none; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }',
      '.mp-close:hover { background: var(--dsw-alias-bg-layer-1); }',
      '.mp-body { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }',
      '.mp-content { display: flex; flex-direction: column; gap: 10px; }',
      '.mp-section-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }',
      '.mp-input { width: 100%; box-sizing: border-box; padding: 7px 9px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; }',
      '.mp-row { display: flex; gap: 6px; }',
      '.mp-btn { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; white-space: nowrap; }',
      '.mp-btn:hover { background: var(--dsw-alias-bg-layer-2); }',
      '.mp-btn:disabled { opacity: 0.5; cursor: not-allowed; }',
      '.mp-btn-primary { background: var(--dsw-alias-accent-primary, #4f7cff); border-color: transparent; color: #fff; }',
      '.mp-btn-primary:hover { filter: brightness(1.08); }',
      '.mp-note { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; }',
      '.mp-empty { font-size: 13px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); text-align: center; padding: 18px 0; }',
      '.mp-guide { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 8px 10px; }',
      '.mp-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 10px 12px; background: var(--dsw-alias-bg-layer-1); display: flex; flex-direction: column; gap: 6px; }',
      '.mp-card-head { display: flex; align-items: center; gap: 8px; }',
      '.mp-icon { font-size: 18px; }',
      '.mp-name { font-weight: 600; font-size: 14px; flex: 1; }',
      '.mp-meta { font-size: 11px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }',
      '.mp-desc { font-size: 12px; color: var(--dsw-alias-label-primary); white-space: pre-wrap; }',
      '.mp-actions { display: flex; gap: 6px; flex-wrap: wrap; }',
      '.mp-badge { font-size: 11px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); white-space: nowrap; }',
      '.mp-badge-warn { background: rgba(255,180,60,0.15); color: #c77700; border-color: rgba(255,180,60,0.4); }',
      '.mp-badge-ok { background: rgba(46,204,113,0.15); color: #1d8a4a; border-color: rgba(46,204,113,0.4); }',
      '.mp-badge-err { background: rgba(255,80,80,0.15); color: #c0392b; border-color: rgba(255,80,80,0.4); }',
      '.mp-source { max-height: 260px; overflow: auto; font-size: 11px; background: var(--dsw-alias-bg-layer-2, #00000014); padding: 8px; border-radius: 8px; white-space: pre; }',
      '.mp-footer-root { flex: none; width: auto; }',
      '.mp-footer-btns { display: flex; }',
      '.mp-badge-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; }',
      '.mp-badge-btn:hover { background: var(--dsw-alias-bg-layer-2); }',
      '.mp-badge-label { font-size: 12px; }',
      '.mp-inline { display: flex; flex-direction: column; gap: 8px; padding: 10px; }',
      '.mp-inline-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }',
      '.mp-inline-list { display: flex; flex-direction: column; gap: 6px; }',
      '.mp-inline-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); }',
      '.mp-inline-name { flex: 1; font-size: 12px; }',
      '.mp-inline-tag { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }',
      '.mp-inline-btn { padding: 3px 9px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; white-space: nowrap; }',
      '.mp-inline-btn:disabled { opacity: 0.5; cursor: not-allowed; }',
      '.mp-inline-btn-primary { background: var(--dsw-alias-accent-primary, #4f7cff); border-color: transparent; color: #fff; }',
    ].join('\n'))

    const listeners = new Set()
    const store = {
      open: false,
      toggle() { store.open = !store.open; for (const l of listeners) l() },
      setOpen(v) { if (store.open === !!v) return; store.open = !!v; for (const l of listeners) l() },
    }
    function useOpen() {
      return React.useSyncExternalStore(
        function (sub) { listeners.add(sub); return function () { listeners.delete(sub) } },
        function () { return store.open },
      )
    }

    function FooterAction(props) {
      const open = useOpen()
      const wide = !!(props && props.wide)
      return React.createElement('div', { className: 'mp-footer-root' },
        React.createElement('div', { className: 'mp-footer-btns' },
          React.createElement('button', {
            type: 'button',
            className: 'mp-badge-btn',
            'aria-label': '插件市场',
            'aria-expanded': open,
            onClick: function () { store.toggle() },
          },
            React.createElement('span', { style: { display: 'inline-flex', fontSize: '16px', lineHeight: 1 } }, '🧩'),
            wide ? React.createElement('span', { className: 'mp-badge-label' }, '插件市场') : null,
          ),
        ),
      )
    }

    function useWorkspacePath(props) {
      const wsItems = props && props.useWorkspaces ? props.useWorkspaces(function (s) { return s.items }) : null
      const wsRecent = props && props.useWorkspaces ? props.useWorkspaces(function (s) { return s.recentWorkspaceId }) : undefined
      const items = wsItems && Array.isArray(wsItems) ? wsItems : []
      if (items.length === 0) return ''
      const recent = items.find(function (w) { return wsRecent !== undefined && w.id === wsRecent }) || items[0]
      return (recent && typeof recent.path === 'string') ? recent.path : ''
    }

    function MarketContent(props) {
      const [state, setState] = React.useState(null)
      const [error, setError] = React.useState('')
      const [info, setInfo] = React.useState('')
      const [registryUrl, setRegistryUrl] = React.useState('')
      const [search, setSearch] = React.useState('')
      const [source, setSource] = React.useState(null)
      const [busy, setBusy] = React.useState('')
      const ws = props.ws || ''

      function refresh() {
        host.call('state', { workspace: ws }).then(function (s) { setState(s) }, function (e) {
          setError(String(e && e.message ? e.message : e))
        })
      }

      function pullNpm(query) {
        setBusy('npm')
        setError('')
        setInfo('正在搜索 npm：' + query + ' …（网络由宿主 curl 执行）')
        host.call('npm-pull', { query }).then(function (r) {
          setBusy('')
          if (r && r.ok) {
            setInfo('npm 搜索完成（' + r.count + ' 个插件' + (r.failed > 0 ? '，' + r.failed + ' 个源码拉取失败' : '，全部拉取成功') + '）')
            refresh()
          } else {
            setError(r && r.error ? r.error : 'npm 拉取失败')
          }
        }, function (e) {
          setBusy('')
          setError('npm 拉取失败：' + String(e && e.message ? e.message : e))
        })
      }

      function autoPull() {
        if (autoState.pulled) return
        autoState.pulled = true
        pullNpm('dsh-plugin')
      }

      React.useEffect(function () {
        refresh()
        autoPull()
      }, [])

      function pullRegistry() {
        const url = String(registryUrl).trim()
        if (url === '') { setError('请输入 registry JSON 地址或 npm:搜索词'); return }
        setBusy('registry')
        setError('')
        setInfo('正在拉取：' + url + ' …（网络由宿主 curl 执行）')
        host.call('registry-pull', { url }).then(function (r) {
          setBusy('')
          if (r && r.ok) {
            setInfo('拉取完成（' + r.count + ' 个插件）')
            refresh()
          } else {
            setError(r && r.error ? r.error : '拉取失败')
          }
        }, function (e) {
          setBusy('')
          setError('拉取失败：' + String(e && e.message ? e.message : e))
        })
      }

      const entries = state && Array.isArray(state.entries) ? state.entries : []
      const q = search.trim().toLowerCase()
      const filtered = q === '' ? entries : entries.filter(function (e) {
        return (e.name + ' ' + e.description + ' ' + (e.tags || []).join(' ')).toLowerCase().indexOf(q) >= 0
      })

      function renderCard(e) {
        const records = (state && state.installed) ? state.installed.filter(function (i) { return i.id === e.id }) : []
        const badge = e.pending
          ? React.createElement('span', { className: 'mp-badge mp-badge-warn' }, '排队中')
          : records.length > 0
            ? React.createElement('span', { className: 'mp-badge ' + (records[0].status === 'failed' ? 'mp-badge-err' : 'mp-badge-ok') }, records[0].status === 'failed' ? '失败' : '已处理 ✓')
            : null
        const kindLabel = e.kind === 'preset-plugin' ? '组合插件' : e.kind === 'skill' ? '技能' : '动态试用'
        const sourceLabel = e.source === 'local' ? '本地仓库' : e.source === 'remote' ? '远端仓库' : '内置'
        const showSource = source !== null && source.id === e.id
        return React.createElement('div', { key: e.id, className: 'mp-card' },
          React.createElement('div', { className: 'mp-card-head' },
            React.createElement('span', { className: 'mp-icon' }, e.icon || '🧩'),
            React.createElement('span', { className: 'mp-name' }, e.name),
            badge,
          ),
          React.createElement('div', { className: 'mp-meta' }, 'v' + (e.version || '1.0.0') + ' · ' + (e.author || '未知作者') + ' · ' + kindLabel + ' · ' + sourceLabel),
          React.createElement('div', { className: 'mp-desc' }, e.description),
          (e.tags && e.tags.length > 0) ? React.createElement('div', { className: 'mp-meta' }, e.tags.map(function (t) { return '#' + t }).join(' ')) : null,
          React.createElement('div', { className: 'mp-actions' },
            (e.kind === 'preset-plugin' || e.kind === 'skill') ? React.createElement('button', {
              className: 'mp-btn mp-btn-primary',
              disabled: !!e.pending || busy !== '',
              onClick: function () {
                setBusy(e.id)
                setError('')
                host.call('request-install', { id: e.id, workspace: ws }).then(function (r) {
                  setBusy('')
                  if (r && r.message) setError(r.message)
                  refresh()
                }, function (err) { setBusy(''); setError(String(err && err.message ? err.message : err)) })
              },
            }, busy === e.id ? '提交中…' : '一键安装') : null,
            e.kind === 'dynamic-plugin' ? React.createElement('button', {
              className: 'mp-btn mp-btn-primary',
              disabled: !!e.pending || busy !== '',
              onClick: function () {
                setBusy(e.id)
                setError('')
                host.call('request-try', { id: e.id, workspace: ws }).then(function (r) {
                  setBusy('')
                  if (r && r.message) setError(r.message)
                  refresh()
                }, function (err) { setBusy(''); setError(String(err && err.message ? err.message : err)) })
              },
            }, busy === e.id ? '提交中…' : '立即试用') : null,
            React.createElement('button', {
              className: 'mp-btn',
              onClick: function () {
                if (showSource) { setSource(null); return }
                host.call('get-source', { id: e.id, workspace: ws }).then(function (r) {
                  if (r && r.ok) setSource({ id: e.id, label: r.label, text: r.source })
                  else setError(r && r.message ? r.message : '读取失败')
                }, function (err) { setError(String(err && err.message ? err.message : err)) })
              },
            }, showSource ? '收起源码' : '查看源码'),
            React.createElement('button', {
              className: 'mp-btn',
              onClick: function () {
                setError('')
                host.call('download', { id: e.id, workspace: ws }).then(function (r) {
                  if (r && r.message) setError(r.message)
                }, function (err) { setError(String(err && err.message ? err.message : err)) })
              },
            }, '下载到工作区'),
          ),
          showSource ? React.createElement('div', null,
            React.createElement('div', { className: 'mp-meta' }, source.label),
            React.createElement('pre', { className: 'mp-source' }, source.text)) : null,
          (records.length > 0 && records[0].message) ? React.createElement('div', { className: 'mp-note' }, records[0].message) : null,
        )
      }

      const netInfo = state && state.net ? '宿主网络：' + state.net.transport + (state.net.available ? '（可用）' : '（shell 服务不可用）') : '宿主网络：探测中…'

      return React.createElement('div', { className: 'mp-content' },
        React.createElement('div', { className: 'mp-guide' },
          '市场打开时自动从 npm 拉取推荐插件（关键词 dsh-plugin）；也可手动输入：① registry JSON 地址（GitHub raw 等）；② npm:搜索词（如 npm:dsh）。网络请求全部由宿主执行，浏览器无需联网权限。\n安装流程：点「一键安装」→ 对话框发送任意消息 → 助手自动完成（永久装进「我的插件集」预设，新会话生效）。'),
        React.createElement('div', { className: 'mp-meta' }, netInfo),
        React.createElement('div', { className: 'mp-section-label' }, '市场源：registry JSON 地址，或 npm:搜索词'),
        React.createElement('div', { className: 'mp-row' },
          React.createElement('input', {
            className: 'mp-input',
            placeholder: 'npm:dsh  或  https://raw.githubusercontent.com/…/registry.json',
            value: registryUrl,
            onChange: function (ev) { setRegistryUrl(ev.target.value) },
          }),
          React.createElement('button', { className: 'mp-btn', disabled: busy === 'registry' || busy === 'npm', onClick: pullRegistry }, busy === 'registry' ? '拉取中…' : '拉取'),
        ),
        state && state.registry && state.registry.name ? React.createElement('div', { className: 'mp-note' },
          '当前源：' + state.registry.name + '（' + state.registry.count + ' 个插件）' + (state.registry.error ? '\n错误：' + state.registry.error : '')) : null,
        state && state.localRegistry ? React.createElement('div', { className: 'mp-note' },
          '📦 ' + state.localRegistry.name + '：' + state.localRegistry.count + ' 个插件 · ' + state.localRegistry.path + (state.localRegistry.error ? '\n读取失败：' + state.localRegistry.error : '')) : null,
        info !== '' ? React.createElement('div', { className: 'mp-note' }, info) : null,
        error !== '' ? React.createElement('div', { className: 'mp-note', style: { color: 'var(--dsw-alias-state-error-primary)' } }, error) : null,
        React.createElement('input', { className: 'mp-input', placeholder: '搜索插件…', value: search, onChange: function (ev) { setSearch(ev.target.value) } }),
        state && state.pending && state.pending.length > 0 ? React.createElement('div', { className: 'mp-note' },
          '⏳ 待处理：' + state.pending.map(function (p) { return p.name }).join('、') + '\n在对话框发送任意消息（如「继续安装」），助手会立即处理。') : null,
        filtered.length === 0 ? React.createElement('div', { className: 'mp-empty' }, '没有匹配的插件。') : filtered.map(renderCard),
      )
    }

    function MarketInline(props) {
      const [state, setState] = React.useState(null)
      const [error, setError] = React.useState('')
      const [busy, setBusy] = React.useState('')
      const ws = useWorkspacePath(props)

      function refresh() {
        host.call('state', { workspace: ws }).then(function (s) { setState(s) }, function (e) {
          setError(String(e && e.message ? e.message : e))
        })
      }

      React.useEffect(function () { refresh() }, [])

      const entries = state && Array.isArray(state.entries) ? state.entries : []

      function row(e) {
        const records = (state && state.installed) ? state.installed.filter(function (i) { return i.id === e.id }) : []
        const kindLabel = e.kind === 'preset-plugin' ? '插件' : e.kind === 'skill' ? '技能' : '试用'
        const srcLabel = e.source === 'local' ? '本地' : e.source === 'remote' ? '远端' : '内置'
        const statusText = e.pending ? '排队中' : (records.length > 0 ? (records[0].status === 'failed' ? '失败' : '已装 ✓') : '')
        const installable = e.kind === 'preset-plugin' || e.kind === 'skill'
        const btnLabel = installable ? '安装' : '试用'
        return React.createElement('div', { key: e.id, className: 'mp-inline-row' },
          React.createElement('span', { style: { fontSize: '15px' } }, e.icon || '🧩'),
          React.createElement('div', { className: 'mp-inline-name' },
            React.createElement('div', null, e.name),
            React.createElement('div', { className: 'mp-meta' }, kindLabel + ' · ' + srcLabel)),
          statusText !== '' ? React.createElement('span', { className: 'mp-inline-tag' }, statusText) : null,
          React.createElement('button', {
            className: 'mp-inline-btn mp-inline-btn-primary',
            disabled: !!e.pending || busy !== '',
            onClick: function () {
              setBusy(e.id)
              setError('')
              const method = installable ? 'request-install' : 'request-try'
              host.call(method, { id: e.id, workspace: ws }).then(function (r) {
                setBusy('')
                if (r && r.message) setError(r.message)
                refresh()
              }, function (err) { setBusy(''); setError(String(err && err.message ? err.message : err)) })
            },
          }, busy === e.id ? '…' : btnLabel),
        )
      }

      return React.createElement('div', { className: 'mp-inline' },
        React.createElement('div', { className: 'mp-inline-head' },
          React.createElement('span', null, '🧩 插件市场（' + entries.length + ' 个可装插件）'),
          React.createElement('span', { style: { flex: 1 } }),
          React.createElement('button', { className: 'mp-inline-btn', onClick: function () { store.setOpen(true) } }, '打开侧边面板'),
          React.createElement('button', { className: 'mp-inline-btn', onClick: refresh }, '刷新'),
        ),
        error !== '' ? React.createElement('div', { className: 'mp-note' }, error) : null,
        React.createElement('div', { className: 'mp-note' },
          '点「安装 / 试用」→ 在对话框发送任意消息（如「继续安装」）→ 助手自动完成。永久安装的插件在新会话选「我的插件集」预设后生效。\n更完整的市场界面在：设置 → 插件市场。'),
        entries.length === 0 ? React.createElement('div', { className: 'mp-empty' }, '没有可安装的插件。') : React.createElement('div', { className: 'mp-inline-list' }, entries.map(row)),
      )
    }

    function MarketPanel(props) {
      const open = useOpen()
      const ws = useWorkspacePath(props)
      if (!open) return null
      return React.createElement('div', { className: 'mp-panel-root' },
        React.createElement('div', { className: 'mp-backdrop', onClick: function () { store.setOpen(false) } }),
        React.createElement('div', { className: 'mp-drawer' },
          React.createElement('div', { className: 'mp-header' },
            React.createElement('span', { className: 'mp-title' }, '🧩 插件市场'),
            React.createElement('button', { className: 'mp-close', onClick: function () { store.setOpen(false) } }, '✕'),
          ),
          React.createElement('div', { className: 'mp-body' },
            React.createElement(MarketContent, { ws }),
          ),
        ),
      )
    }

    function MarketSettings(props) {
      const ws = useWorkspacePath(props)
      return React.createElement(MarketContent, { ws })
    }

    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'plugin-marketplace', order: 30, label: '插件市场' },
      (props) => React.createElement(MarketSettings, { useWorkspaces: props ? props.useWorkspaces : undefined }),
    ))

    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'plugin-marketplace', order: 10, label: '插件市场' },
      (props) => React.createElement(FooterAction, { wide: !!(props && props.wide) }),
    ))

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'plugin-marketplace-panel', order: 10, label: '插件市场面板' },
      (props) => React.createElement(MarketPanel, { useWorkspaces: props ? props.useWorkspaces : undefined }),
    ))

    slots.inject('tool.view.cordis', () => slots.register(
      { name: 'tool.view.cordis', key: 'self' },
      (props) => React.createElement(MarketInline, { useWorkspaces: props ? props.useWorkspaces : undefined }),
    ))
  },
}
