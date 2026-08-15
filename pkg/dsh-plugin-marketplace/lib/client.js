window.__ModuleLoader__.load({
	id: "dsh-plugin-marketplace",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");

		// ---------- 样式 ----------
		const css = [
			'.mp-panel-root { position: fixed; inset: 0; pointer-events: none; z-index: 9990; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }',
			'.mp-backdrop { position: absolute; inset: 0; background: rgba(10,12,18,0.32); pointer-events: auto; animation: mp-fade .18s ease-out; }',
			'.mp-drawer { position: absolute; top: 10px; right: 10px; bottom: 10px; width: 424px; max-width: 94vw; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; box-shadow: -16px 12px 48px rgba(0,0,0,0.25); pointer-events: auto; overflow: hidden; animation: mp-slide .22s cubic-bezier(.2,.8,.2,1); }',
			'@keyframes mp-slide { from { transform: translateX(28px); opacity: 0; } to { transform: none; opacity: 1; } }',
			'@keyframes mp-fade { from { opacity: 0; } to { opacity: 1; } }',
			'.mp-header { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); flex: none; }',
			'.mp-title { font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }',
			'.mp-count { font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2, #00000014); border-radius: 999px; padding: 1px 8px; }',
			'.mp-close { border: none; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 16px; cursor: pointer; padding: 5px 9px; border-radius: 8px; margin-left: auto; }',
			'.mp-close:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }',
			'.mp-root { flex: 1; min-height: 0; display: flex; flex-direction: column; }',
			'.mp-toolbar { display: flex; gap: 8px; padding: 10px 14px 0; flex: none; }',
			'.mp-search { flex: 1; position: relative; }',
			'.mp-input { width: 100%; box-sizing: border-box; padding: 7px 10px 7px 30px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; }',
			'.mp-input:focus-visible { border-color: var(--dsw-alias-accent-primary, #4f7cff); outline: none; }',
			'.mp-search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); pointer-events: none; }',
			'.mp-input-plain { width: 100%; box-sizing: border-box; padding: 7px 10px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; }',
			'.mp-input-plain:focus-visible { border-color: var(--dsw-alias-accent-primary, #4f7cff); outline: none; }',
			'.mp-row { display: flex; gap: 6px; }',
			'.mp-btn { padding: 6px 12px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; white-space: nowrap; }',
			'.mp-btn:hover { background: var(--dsw-alias-bg-layer-2); }',
			'.mp-btn:disabled { opacity: 0.45; cursor: not-allowed; }',
			'.mp-btn-primary { background: var(--dsw-alias-accent-primary, #4f7cff); border-color: transparent; color: #fff; }',
			'.mp-btn-primary:hover:not(:disabled) { filter: brightness(1.08); background: var(--dsw-alias-accent-primary, #4f7cff); }',
			'.mp-filter-row { display: flex; gap: 6px; padding: 10px 14px 2px; flex-wrap: wrap; flex: none; }',
			'.mp-target-row { display: flex; align-items: center; gap: 8px; padding: 8px 14px 0; flex: none; }',
			'.mp-target-label { font-size: 12px; color: var(--dsw-alias-label-secondary); flex: none; }',
			'.mp-target-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); flex: 1; min-width: 0; }',
			'.mp-chip { font-size: 12px; padding: 3px 11px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; white-space: nowrap; }',
			'.mp-chip:hover { background: var(--dsw-alias-bg-layer-1); }',
			'.mp-chip-on { background: var(--dsw-alias-accent-primary, #4f7cff); border-color: transparent; color: #fff; }',
			'.mp-chip-on:hover { background: var(--dsw-alias-accent-primary, #4f7cff); filter: brightness(1.06); }',
			'.mp-body { flex: 1; overflow-y: auto; padding: 10px 14px 14px; display: flex; flex-direction: column; gap: 10px; }',
			'.mp-banner { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; border-radius: 9px; padding: 8px 10px; white-space: pre-wrap; }',
			'.mp-banner-info { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }',
			'.mp-banner-err { background: rgba(255,80,80,0.10); border: 1px solid rgba(255,80,80,0.35); color: var(--dsw-alias-state-error-primary, #c0392b); }',
			'.mp-banner-x { margin-left: auto; border: none; background: transparent; color: inherit; cursor: pointer; font-size: 13px; padding: 0 2px; opacity: .7; }',
			'.mp-banner-x:hover { opacity: 1; }',
			'.mp-guide-toggle { align-self: flex-start; display: inline-flex; align-items: center; gap: 5px; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; cursor: pointer; padding: 2px 4px; border-radius: 6px; }',
			'.mp-guide-toggle:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); }',
			'.mp-guide { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 9px 11px; }',
			'.mp-section-label { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); }',
			'.mp-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; padding: 11px 13px; background: var(--dsw-alias-bg-layer-1); display: flex; flex-direction: column; gap: 7px; transition: border-color .12s ease; }',
			'.mp-card:hover { border-color: var(--dsw-alias-border-l2); }',
			'.mp-card-top { display: flex; align-items: center; gap: 9px; }',
			'.mp-icon { width: 34px; height: 34px; flex: none; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2, #00000014); }',
			'.mp-name { font-weight: 600; font-size: 14px; flex: 1; overflow-wrap: anywhere; }',
			'.mp-ver { font-size: 11px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2, #00000014); border-radius: 999px; padding: 1px 8px; white-space: nowrap; }',
			'.mp-badge { font-size: 11px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); white-space: nowrap; }',
			'.mp-badge-ok { background: rgba(46,204,113,0.15); color: #1d8a4a; border-color: rgba(46,204,113,0.4); }',
			'.mp-badge-err { background: rgba(255,80,80,0.15); color: #c0392b; border-color: rgba(255,80,80,0.4); }',
			'.mp-badge-warn { background: rgba(255,180,60,0.15); color: #b87900; border-color: rgba(255,180,60,0.4); }',
			'.mp-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11px; color: var(--dsw-alias-label-secondary); }',
			'.mp-tag { background: var(--dsw-alias-bg-layer-2, #00000014); color: var(--dsw-alias-label-secondary); border-radius: 999px; padding: 1px 8px; }',
			'.mp-desc { font-size: 12px; color: var(--dsw-alias-label-primary); white-space: pre-wrap; line-height: 1.55; }',
			'.mp-actions { display: flex; gap: 6px; flex-wrap: wrap; }',
			'.mp-source { max-height: 240px; overflow: auto; font-size: 11px; background: var(--dsw-alias-bg-layer-2, #00000014); padding: 8px 10px; border-radius: 8px; white-space: pre; margin: 0; }',
			'.mp-note { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; }',
			'.mp-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); text-align: center; padding: 34px 0 22px; }',
			'.mp-empty-icon { font-size: 34px; opacity: .8; }',
			'.mp-empty-text { font-size: 13px; }',
			'.mp-footer { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-top: 1px solid var(--dsw-alias-border-l1); font-size: 11px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); flex: none; }',
			'.mp-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }',
			'.mp-dot-on { background: #2ecc71; }',
			'.mp-dot-off { background: #e74c3c; }',
			'.mp-side-wrap { box-sizing: border-box; flex: none; align-items: center; width: 100%; height: 49px; margin: 8px 0 0; display: flex; }',
			'.mp-side-action { width: 100%; height: 49px; color: var(--dsw-alias-label-primary); cursor: pointer; background: transparent; border: none; border-radius: 12px; align-items: center; gap: 8px; padding: 0 8px 0 6px; font-family: inherit; font-size: 14px; display: inline-flex; overflow: hidden; }',
			'.mp-side-action:hover { background: var(--dsw-alias-interactive-bg-hover-solid); }',
			'.mp-side-icon { display: inline-flex; font-size: 16px; line-height: 1; flex: none; }',
			'.mp-side-label { text-overflow: ellipsis; white-space: nowrap; min-width: 0; overflow: hidden; flex: 1; text-align: left; }',
			'.mp-side-wrap.mp-side-rail { width: 36px; height: 36px; margin: 0; }',
			'.mp-side-rail .mp-side-action { border-radius: 50%; justify-content: center; gap: 0; width: 36px; height: 36px; padding: 0; }',
		].join("\n");
		const cssTagId = "dsh-plugin-marketplace/style.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(cssTagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-plugin-marketplace";
			tag.dataset.pluginCss = cssTagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		// ---------- 状态 ----------
		const listeners = new Set();
		const store = {
			open: false,
			setOpen(v) { if (store.open === !!v) return; store.open = !!v; for (const l of listeners) l(); },
		};
		function useOpen() {
			return React.useSyncExternalStore(
				function (sub) { listeners.add(sub); return function () { listeners.delete(sub); }; },
				function () { return store.open; },
			);
		}

		// ---------- API ----------
		function apiCall(method, params) {
			const qs = new URLSearchParams();
			qs.set("m", method);
			for (const k of Object.keys(params || {})) {
				const v = params[k];
				if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
			}
			return fetch("/plugin-marketplace/api?" + qs.toString(), { credentials: "same-origin" }).then(function (r) {
				if (!r.ok) throw new Error("HTTP " + r.status);
				return r.json();
			});
		}

		const autoState = { pulled: false };

		function kindLabel(kind) {
			return kind === "preset-plugin" ? "组合插件" : kind === "skill" ? "技能" : "动态试用";
		}
		function sourceLabel(source) {
			return source === "local" ? "本地仓库" : source === "remote" ? "远端仓库" : source === "bundled" ? "内置市场" : "内置";
		}

		// ---------- 左侧栏按钮 ----------
		// 槽位系统没有顶部挂载点：按钮注册在底部动作槽（隐形锚点），运行时把真实按钮
		// 插入侧边栏主列的布局流中——「新会话」与「工作区」之间，由 flex 自然排布、无遮挡。
		// 按钮是命令式创建的自有节点（React 不管理它，避免协调冲突）；锚点仍由 React 渲染。
		function SidebarAction(props) {
			const wide = !!(props && props.wide);
			const anchorRef = React.useRef(null);

			React.useEffect(function () {
				let disposed = false;
				let btn = null;

				function build() {
					if (btn !== null && btn.isConnected) return btn;
					if (btn !== null) { try { btn.remove(); } catch (e) { /* 忽略 */ } }
					btn = document.createElement("button");
					btn.type = "button";
					btn.className = "mp-side-action";
					btn.setAttribute("aria-label", "插件市场");
					btn.title = "插件市场";
					if (wide) {
						btn.style.width = "100%";
						btn.style.height = "49px";
						btn.style.borderRadius = "12px";
						btn.style.margin = "0 2px 8px";
					} else {
						btn.style.width = "36px";
						btn.style.height = "36px";
						btn.style.borderRadius = "50%";
						btn.style.margin = "0 auto 8px";
						btn.style.justifyContent = "center";
						btn.style.padding = "0";
					}
					const icon = document.createElement("span");
					icon.className = "mp-side-icon";
					icon.setAttribute("aria-hidden", "true");
					icon.textContent = "🧩";
					btn.appendChild(icon);
					if (wide) {
						const label = document.createElement("span");
						label.className = "mp-side-label";
						label.textContent = "插件市场";
						btn.appendChild(label);
					}
					btn.addEventListener("click", function () { store.setOpen(true); });
					return btn;
				}

				function findColumn() {
					const anchor = anchorRef.current;
					if (!anchor) return null;
					let el = anchor.parentElement;
					while (el && el !== document.body) {
						const r = el.getBoundingClientRect();
						if (r.height >= window.innerHeight * 0.6 && r.width >= 36 && r.width <= 480) return el;
						el = el.parentElement;
					}
					return null;
				}

				function place() {
					if (disposed) return;
					const column = findColumn();
					if (!column) return;
					const kids = Array.from(column.children);
					let regionIdx = -1;
					for (let i = 0; i < kids.length; i++) {
						const r = kids[i].getBoundingClientRect();
						if (r.height >= column.clientHeight * 0.35) { regionIdx = i; break; }
					}
					if (regionIdx === -1) return;
					const b = build();
					if (b.parentElement === column && b.nextSibling === kids[regionIdx]) return; // 已就位
					try { column.insertBefore(b, kids[regionIdx]); } catch (e) { /* 忽略 */ }
				}

				place();
				const t1 = setTimeout(place, 250);
				const t2 = setTimeout(place, 1200);
				const interval = setInterval(place, 2000);
				window.addEventListener("resize", place);
				return function () {
					disposed = true;
					clearTimeout(t1); clearTimeout(t2); clearInterval(interval);
					window.removeEventListener("resize", place);
					if (btn !== null) { try { btn.remove(); } catch (e) { /* 忽略 */ } btn = null; }
				};
			}, [wide]);

			// 隐形锚点：仅用于从底部槽位向上定位侧边栏主列
			return React.createElement("div", { ref: anchorRef, style: { display: "none" } });
		}

		function useWorkspacePath(props) {
			const wsItems = props && props.useWorkspaces ? props.useWorkspaces(function (s) { return s.items; }) : null;
			const wsRecent = props && props.useWorkspaces ? props.useWorkspaces(function (s) { return s.recentWorkspaceId; }) : undefined;
			const items = wsItems && Array.isArray(wsItems) ? wsItems : [];
			if (items.length === 0) return "";
			const recent = items.find(function (w) { return wsRecent !== undefined && w.id === wsRecent; }) || items[0];
			return (recent && typeof recent.path === "string") ? recent.path : "";
		}

		// ---------- 市场主体 ----------
		function MarketContent(props) {
			const [state, setState] = React.useState(null);
			const [error, setError] = React.useState("");
			const [info, setInfo] = React.useState("");
			const [registryUrl, setRegistryUrl] = React.useState("");
			const [search, setSearch] = React.useState("");
			const [filter, setFilter] = React.useState("all");
			const [source, setSource] = React.useState(null);
			const [busy, setBusy] = React.useState("");
			const [guideOpen, setGuideOpen] = React.useState(false);
			const [cardMsg, setCardMsg] = React.useState({});
			const [strict, setStrict] = React.useState(true);
			const ws = props.ws || "";

			function setCardNote(id, text, ok) {
				setCardMsg(function (prev) {
					const next = Object.assign({}, prev);
					next[id] = { text, ok: !!ok, ts: Date.now() };
					return next;
				});
			}

			function refresh() {
				apiCall("state", { ws }).then(function (s) { setState(s); }, function (e) {
					setError(String(e && e.message ? e.message : e));
				});
			}

			function pullNpm(query) {
				const label = query ? "关键词 " + query : "内置关键词集合（" + "dsh-plugin、deepseek-harness" + "）";
				setBusy("npm");
				setError("");
				setInfo("正在从 npm 聚合拉取插件库（" + label + "）…");
				const params = query ? { query } : {};
				apiCall("npm-pull", params).then(function (r) {
					setBusy("");
					if (r && r.ok) {
						setInfo("npm 插件库已更新（" + r.count + " 个可直接安装的插件" + (r.filtered > 0 ? "，过滤掉 " + r.filtered + " 个不兼容/无关的包" : "") + "）");
						refresh();
					} else {
						setError(r && r.error ? r.error : "npm 拉取失败");
					}
				}, function (e) {
					setBusy("");
					setError("npm 拉取失败：" + String(e && e.message ? e.message : e));
				});
			}

			function autoPull() {
				// 宿主启动时已后台预拉 npm；面板打开只刷新状态，不再重复拉取、不再阻塞界面
				if (autoState.pulled) return;
				autoState.pulled = true;
			}

			React.useEffect(function () {
				refresh();
				autoPull();
			}, []);

			function pullRegistry() {
				const url = String(registryUrl).trim();
				if (url === "") { setError("请输入 registry JSON 地址或 npm:搜索词"); return; }
				setBusy("registry");
				setError("");
				setInfo("正在拉取：" + url + " …");
				apiCall("registry-pull", { url }).then(function (r) {
					setBusy("");
					if (r && r.ok) {
						setInfo("拉取完成（" + r.count + " 个插件）");
						refresh();
					} else {
						setError(r && r.error ? r.error : "拉取失败");
					}
				}, function (e) {
					setBusy("");
					setError("拉取失败：" + String(e && e.message ? e.message : e));
				});
			}

			const entries = state && Array.isArray(state.entries) ? state.entries : [];
			const q = search.trim().toLowerCase();
			const kindCounts = { all: entries.length, "preset-plugin": 0, skill: 0, "dynamic-plugin": 0 };
			for (const e of entries) if (kindCounts[e.kind] !== undefined) kindCounts[e.kind] += 1;
			// 「仅 DSH 相关」：隐藏远端来源里名称不含 DSH/DeepSeek 特征的误报包（如 react-native-harness 等）
			function dshRelated(e) {
				return /dsh|deepseek|create-dsh/i.test(String(e.id || ""));
			}
			const hiddenCount = strict ? entries.filter(function (e) { return e.source === "remote" && !dshRelated(e); }).length : 0;
			const filtered = entries.filter(function (e) {
				if (filter !== "all" && e.kind !== filter) return false;
				if (strict && e.source === "remote" && !dshRelated(e)) return false;
				if (q === "") return true;
				return (e.name + " " + e.description + " " + (e.tags || []).join(" ")).toLowerCase().indexOf(q) >= 0;
			});

			function renderFilter(kind, label) {
				return React.createElement("button", {
					key: kind,
					type: "button",
					className: "mp-chip" + (filter === kind ? " mp-chip-on" : ""),
					onClick: function () { setFilter(kind); },
				}, label + " " + kindCounts[kind]);
			}

			function renderCard(e) {
				const records = (state && state.installed) ? state.installed.filter(function (i) { return i.id === e.id; }) : [];
				const installedOk = records.length > 0 && records[0].status !== "failed";
				const badge = e.fileError
					? React.createElement("span", { className: "mp-badge mp-badge-warn" }, "源码缺失")
					: installedOk
						? React.createElement("span", { className: "mp-badge mp-badge-ok" }, "已安装 ✓")
						: null;
				const installable = e.kind === "preset-plugin" || e.kind === "skill";
				const showSource = source !== null && source.id === e.id;
				return React.createElement("div", { key: e.id, className: "mp-card" },
					React.createElement("div", { className: "mp-card-top" },
						React.createElement("span", { className: "mp-icon" }, e.icon || "🧩"),
						React.createElement("span", { className: "mp-name" }, e.name),
						e.version ? React.createElement("span", { className: "mp-ver" }, "v" + e.version) : null,
						badge,
					),
					React.createElement("div", { className: "mp-meta" },
						React.createElement("span", { className: "mp-tag" }, kindLabel(e.kind)),
						React.createElement("span", { className: "mp-tag" }, sourceLabel(e.source)),
						(e.author && e.author !== "npm") ? React.createElement("span", null, e.author) : null,
					),
					React.createElement("div", { className: "mp-desc" }, e.description),
					(e.tags && e.tags.length > 0) ? React.createElement("div", { className: "mp-meta" }, e.tags.slice(0, 6).map(function (t) { return React.createElement("span", { key: t, className: "mp-tag" }, "#" + t); })) : null,
					React.createElement("div", { className: "mp-actions" },
						installable ? React.createElement("button", {
							className: "mp-btn mp-btn-primary",
							disabled: busy === e.id || !!e.fileError,
							title: e.fileError ? e.fileError : "",
							onClick: function () {
								setBusy(e.id);
								setError("");
								setCardNote(e.id, "全局安装中…", null);
								apiCall("install", { id: e.id, ws, target: "global" }).then(function (r) {
									setBusy("");
									if (r && r.ok) {
										setInfo(r.message || "安装完成");
										setCardNote(e.id, r.message || "安装完成", true);
									} else {
										const msg = r && r.error ? r.error : "安装失败";
										setError(msg);
										setCardNote(e.id, msg, false);
									}
									refresh();
								}, function (err) {
									setBusy("");
									const msg = "安装失败：" + String(err && err.message ? err.message : err);
									setError(msg);
									setCardNote(e.id, msg, false);
								});
							},
						}, busy === e.id ? "安装中…" : "一键安装") : null,
						!installable ? React.createElement("button", {
							className: "mp-btn mp-btn-primary",
							disabled: busy === e.id,
							onClick: function () {
								setBusy(e.id);
								setError("");
								setCardNote(e.id, "下载中…", null);
								apiCall("download", { id: e.id, ws }).then(function (r) {
									setBusy("");
									if (r && r.ok) {
										setInfo(r.message + "\n\n动态试用：在聊天里让助手读取 .plugin-marketplace/downloads/" + e.id + "/manifest.json，用 cordis 工具定义并运行。");
										setCardNote(e.id, "已下载到工作区", true);
									} else {
										const msg = r && r.error ? r.error : "下载失败";
										setError(msg);
										setCardNote(e.id, msg, false);
									}
								}, function (err) {
									setBusy("");
									const msg = "下载失败：" + String(err && err.message ? err.message : err);
									setError(msg);
									setCardNote(e.id, msg, false);
								});
							},
						}, busy === e.id ? "下载中…" : "下载到工作区") : null,
						React.createElement("button", {
							className: "mp-btn",
							onClick: function () {
								if (showSource) { setSource(null); return; }
								apiCall("get-source", { id: e.id, ws }).then(function (r) {
									if (r && r.ok) setSource({ id: e.id, label: r.label, text: r.source });
									else setError(r && r.error ? r.error : "读取失败");
								}, function (err) { setError(String(err && err.message ? err.message : err)); });
							},
						}, showSource ? "收起源码 ▲" : "查看源码"),
					),
					showSource ? React.createElement("div", null,
						React.createElement("div", { className: "mp-meta" }, source.label),
						React.createElement("pre", { className: "mp-source" }, source.text)) : null,
					e.fileError ? React.createElement("div", { className: "mp-note", style: { color: "var(--dsw-alias-state-error-primary, #c0392b)" } }, "源码拉取失败：" + e.fileError + "（该包在 jsDelivr 上没有可直接引用的默认文件，无法安装；可到 npm 页面手动下载）") : null,
					cardMsg[e.id] ? React.createElement("div", {
						className: "mp-note",
						style: { color: cardMsg[e.id].ok === false ? "var(--dsw-alias-state-error-primary, #c0392b)" : (cardMsg[e.id].ok === true ? "#1d8a4a" : "var(--dsw-alias-label-secondary)") },
					}, (cardMsg[e.id].ok === true ? "✓ " : cardMsg[e.id].ok === false ? "✗ " : "⏳ ") + cardMsg[e.id].text) : null,
					(records.length > 0 && records[0].message) ? React.createElement("div", { className: "mp-note" }, records[0].message) : null,
				);
			}

			const netOk = state && state.net ? !!state.net.available : false;
			const netText = state && state.net ? state.net.transport : "探测中…";
			const targetNote = "安装目标：全局（所有模式）";

			return React.createElement("div", { className: "mp-root" },
				React.createElement("div", { className: "mp-toolbar" },
					React.createElement("div", { className: "mp-search" },
						React.createElement("span", { className: "mp-search-icon" }, "🔍"),
						React.createElement("input", {
							className: "mp-input",
							placeholder: "搜索插件…",
							value: search,
							onChange: function (ev) { setSearch(ev.target.value); },
						}),
					),
					React.createElement("button", { className: "mp-btn", title: "重新聚合拉取 npm 插件库", disabled: busy !== "", onClick: function () { pullNpm(null); } }, busy === "npm" ? "拉取中…" : "↻"),
				),
				React.createElement("div", { className: "mp-filter-row" },
					renderFilter("all", "全部"),
					renderFilter("preset-plugin", "组合插件"),
					renderFilter("skill", "技能"),
					renderFilter("dynamic-plugin", "试用"),
					React.createElement("button", {
						type: "button",
						className: "mp-chip" + (strict ? " mp-chip-on" : ""),
						title: "只显示名称含 DSH/DeepSeek 的远端包（npm 搜索结果里混入的无关包会被隐藏）",
						onClick: function () { setStrict(!strict); },
					}, "仅 DSH 相关"),
				),
				strict && hiddenCount > 0 ? React.createElement("div", { className: "mp-note", style: { padding: "0 14px" } },
					"已隐藏 " + hiddenCount + " 个疑似无关的远端包（如 react-native-harness 等）。点击「仅 DSH 相关」可显示全部。") : null,
				React.createElement("div", { className: "mp-body" },
					error !== "" ? React.createElement("div", { className: "mp-banner mp-banner-err" },
						React.createElement("span", null, "⚠ " + error),
						React.createElement("button", { type: "button", className: "mp-banner-x", onClick: function () { setError(""); } }, "✕")) : null,
					info !== "" ? React.createElement("div", { className: "mp-banner mp-banner-info" },
						React.createElement("span", null, "ℹ " + info),
						React.createElement("button", { type: "button", className: "mp-banner-x", onClick: function () { setInfo(""); } }, "✕")) : null,
					React.createElement("button", { type: "button", className: "mp-guide-toggle", onClick: function () { setGuideOpen(!guideOpen); } },
						(guideOpen ? "▾" : "▸") + " 使用说明"),
					guideOpen ? React.createElement("div", { className: "mp-guide" },
						"• 市场自带「内置市场」（随包附带的 10 个现成插件与技能），并在启动时后台聚合拉取 npm 生态插件（关键词 dsh-plugin、deepseek-harness），打开即可浏览；点 ↻ 可重拉。\n• 「一键安装」= 全局安装：组合插件写入宿主补丁层，重启 dsh 后所有模式的会话都加载；技能装进全局技能目录，所有模式可用。\n• 市场源：输入 registry JSON 地址（GitHub raw 等）或 npm:搜索词（如 npm:dsh），点「拉取」。\n• 「试用」类插件会下载到工作区 .plugin-marketplace/downloads/，可让助手用 cordis 工具运行。\n• 网络请求全部由宿主执行（curl），浏览器不直接联网。") : null,
					React.createElement("div", { className: "mp-section-label" }, "市场源"),
					React.createElement("div", { className: "mp-row" },
						React.createElement("input", {
							className: "mp-input-plain",
							placeholder: "npm:dsh  或  https://raw.githubusercontent.com/…/registry.json",
							value: registryUrl,
							onChange: function (ev) { setRegistryUrl(ev.target.value); },
							onKeyDown: function (ev) { if (ev.key === "Enter") pullRegistry(); },
						}),
						React.createElement("button", { className: "mp-btn", disabled: busy !== "", onClick: pullRegistry }, busy === "registry" ? "拉取中…" : "拉取"),
					),
					state && state.registry && state.registry.name ? React.createElement("div", { className: "mp-note" },
						"当前源：" + state.registry.name + "（" + state.registry.count + " 个插件）") : null,
					state && (!state.registry || state.registry.count === 0) ? React.createElement("div", { className: "mp-note" },
						"npm 生态暂时没有可直接安装的 DSH 组合插件（自动拉取已过滤掉不兼容包）。市场内容以内置市场、本地仓库与自定义 registry 为主；点 ↻ 可重新拉取。") : null,
					state && state.localRegistry ? React.createElement("div", { className: "mp-note" },
						"📦 本地仓库：" + state.localRegistry.count + " 个插件 · " + state.localRegistry.path) : null,
					filtered.length === 0 ? React.createElement("div", { className: "mp-empty" },
						React.createElement("span", { className: "mp-empty-icon" }, "🧩"),
						React.createElement("span", { className: "mp-empty-text" }, q !== "" || filter !== "all" ? "没有匹配的插件" : "暂无插件，点 ↻ 拉取 npm 插件库"),
					) : filtered.map(renderCard),
				),
				React.createElement("div", { className: "mp-footer" },
					React.createElement("span", { className: "mp-dot " + (netOk ? "mp-dot-on" : "mp-dot-off") }),
					React.createElement("span", { style: { flex: 1 } }, netOk ? "宿主网络正常（" + netText + "）" : "宿主网络不可用"),
					React.createElement("span", null, targetNote),
					React.createElement("span", { title: "界面版本 v10" }, "v10"),
				),
			);
		}

		function MarketPanel(props) {
			const open = useOpen();
			const ws = useWorkspacePath(props);
			if (!open) return null;
			return React.createElement("div", { className: "mp-panel-root" },
				React.createElement("div", { className: "mp-backdrop", onClick: function () { store.setOpen(false); } }),
				React.createElement("div", { className: "mp-drawer" },
					React.createElement("div", { className: "mp-header" },
						React.createElement("span", { className: "mp-title" }, "🧩 插件市场"),
						React.createElement("button", { className: "mp-close", "aria-label": "关闭", onClick: function () { store.setOpen(false); } }, "✕"),
					),
					React.createElement(MarketContent, { ws }),
				),
			);
		}

		// ---------- 插件 ----------
		const name = "plugin-marketplace";
		const inject = ["slots"];

		function apply(ctx) {
			// 左侧栏按钮：点击「插件市场」→ 右侧抽屉弹出
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register(
				{ name: "sidebar.footer.action", id: "plugin-marketplace", order: 10, label: "插件市场" },
				(props) => React.createElement(SidebarAction, { wide: !!(props && props.wide) }),
			));

			// 右侧抽屉面板
			ctx.slots.inject("shell.overlay", () => ctx.slots.register(
				{ name: "shell.overlay", id: "plugin-marketplace-panel", order: 10, label: "插件市场面板" },
				(props) => React.createElement(MarketPanel, { useWorkspaces: props ? props.useWorkspaces : undefined }),
			));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
