# 插件市场 · 安装与维护文档

## 当前状态：已作为 npm 双面包永久安装 ✅

插件市场现在是**常驻插件**（不再是随重启消失的动态插件）：

- 包源码：`F:\Administrator\Documents\WorkBuddy\.plugin-marketplace\pkg\dsh-plugin-marketplace\`
- 安装方式：web profile 依赖链接 + profile 补丁行
  - `C:\Users\Administrator\.dsh\profiles\web\package.json` → dependencies 含
    `"dsh-plugin-marketplace": "link:F:/Administrator/Documents/WorkBuddy/.plugin-marketplace/pkg/dsh-plugin-marketplace"`
  - `C:\Users\Administrator\.dsh\profiles\web\cordis.patch.yml` → `insert` 行（`id: plugin-marketplace, name: dsh-plugin-marketplace`）
  - 该补丁层被 dsh 实时监听：改包源码后 `pnpm install` + 保存补丁即生效；重启后同样存活
- 界面入口：**左侧栏「🧩 插件市场」按钮（位于「新会话」与工作区之间）→ 点击后右侧抽屉弹出**（无设置页入口；首次安装后刷新一次页面即可看到）
- 安装目标：**全局（所有模式）**——组合插件源码写入市场包 `global-plugins/`（`exports["./plugins/*"]` 映射）+ 在 `$DSH_HOME/cordis.patch.yml` 宿主补丁层追加 `dsh-plugin-marketplace/plugins/<id>` 行，重启 dsh 后所有模式的会话都加载；技能装进全局技能目录，所有模式可用
- 市场内容：**包内预置市场（bundled/，10 个现成插件与技能）+ npm 聚合拉取（关键词 dsh-plugin、deepseek-harness，只保留 DSH 生态相关包）**；启动即后台预拉
- 宿主 API：`http://127.0.0.1:3080/plugin-marketplace/api?m=…`（state / npm-pull / registry-pull / install(target) / get-source / download）

验证结果（全部通过）：

- npm 自动拉取：10 个包合并成功（7 个源码完整，3 个 jsDelivr 缺省文件缺失被标记）
- 一键安装 `now-iso` → 预设 `standard-plugins`（mount 校验通过，`plugins/now-iso.js` + `mp-now-iso` 行）
- 一键安装技能 `zh-commit-guide` → `~/.dsh/skills/zh-commit-guide/SKILL.md`（立即进入技能目录）

## 目录结构（工作区 .plugin-marketplace）

- `pkg/dsh-plugin-marketplace/` — **npm 双面包源码（交付物）**
  - `lib/index.js` 宿主插件（目录、curl 网络、一键安装、JSON API 路由）
  - `lib/client.js` 浏览器 bundle（`window.__ModuleLoader__` handoff，面板 UI，fetch 调宿主 API）
  - `cordis.patch.yml` bundle 补丁、`registry.example.json` 远端仓库示例、`README.md` 发布说明
- `self/host.js` + `self/client.js` — 旧动态插件备份（已被永久版取代，仅供参考/回退）
- `registry.json` + `plugins/` + `skills/` — 本地仓库（市场面板自动加载）

## 发布给别人用

```sh
cd .plugin-marketplace/pkg/dsh-plugin-marketplace
npm publish            # 或 npm pack 生成 tarball
```

安装方：把包装进 profile 的 node_modules（`pnpm add dsh-plugin-marketplace` 或 link），
再在 profile 的 `cordis.patch.yml` 加：

```yaml
- insert:
    - id: plugin-marketplace
      name: dsh-plugin-marketplace
```

远端插件仓库格式见 `pkg/dsh-plugin-marketplace/registry.example.json`（kind：preset-plugin / skill / dynamic-plugin）。

## 已永久安装的内容（更早的 5 工具 + 5 技能）

- 预设 `standard-plugins`（我的插件集）：uuid-tool、timestamp-tool、base64-tool、case-tool、char-count、**now-iso**
- 技能：code-review-checklist、markdown-style-guide、pwsh-script-style、api-design-notes、logging-guidelines、**zh-commit-guide**

## 已知边界

- 宿主网络依赖 `shell` 服务 + `curl.exe`；无外网时内置与本地仓库仍可用
- npm 包里 `exports` 无 `./client` 默认文件的包，jsDelivr 拉取会失败并在卡片标记「源码缺失」
- 面板的「动态试用」= 下载到工作区 + 提示让助手用 cordis 工具运行
- 修改 `lib/client.js` 后，dsh-client-hmr 会轮询重哈希并推送 rebuilt 帧，页面会热更新；首次新增入口需要刷新页面
