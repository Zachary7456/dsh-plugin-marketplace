# dsh-plugin-marketplace（DeepSeek Harness 插件市场）

DeepSeek Harness 网页版「插件市场」——npm 双面包（宿主插件 + 浏览器面板），常驻左侧栏，浏览 / 一键全局安装插件与技能。

## 目录

- `pkg/dsh-plugin-marketplace/` — **npm 双面包源码（发布物）**
  - `lib/index.js` 宿主插件：市场目录、宿主 curl 网络、一键全局安装（宿主补丁层）、JSON API 路由、装前体检（形状/语法校验 + 预设安装失败自动回滚）
  - `lib/client.js` 浏览器 bundle：`window.__ModuleLoader__` handoff，左侧栏入口 + 右侧抽屉面板（搜索/筛选/「仅 DSH 相关」/卡片式 UI）
  - `bundled/` 内置市场（19 个现成插件与技能，任何安装方开箱即见）
  - `global-plugins/` 全局安装的插件文件目录（`exports["./plugins/*"]` 映射，宿主补丁层按 `dsh-plugin-marketplace/plugins/<id>` 引用）
  - `cordis.patch.yml` bundle 补丁、`registry.example.json` 远端仓库示例
- `plugins/` `skills/` `registry.json` — 本地演示仓库（市场面板自动加载当前工作区 `.plugin-marketplace/`）
- `self/` — 安装与维护文档

## 安装（常驻，重启保留）

1. 把包装进 profile 的 node_modules（`pnpm add dsh-plugin-marketplace`，或 `link:` 到本地源码）
2. 在 profile 的 `cordis.patch.yml` 加一行：

   ```yaml
   - insert:
       - id: plugin-marketplace
         name: dsh-plugin-marketplace
   ```

3. 刷新页面：左侧栏「🧩 插件市场」按钮（新会话与工作区之间）→ 右侧抽屉

## 发布

```sh
cd pkg/dsh-plugin-marketplace
npm publish   # 或 npm pack
```

远端仓库格式见 `pkg/dsh-plugin-marketplace/registry.example.json`（kind：preset-plugin / skill / dynamic-plugin）。

## 许可

MIT
