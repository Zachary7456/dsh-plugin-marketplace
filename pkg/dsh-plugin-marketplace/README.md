# dsh-plugin-marketplace

DeepSeek Harness 网页版「插件市场」双面包：宿主插件 + 浏览器面板，常驻在侧边栏与设置页。

- 打开即自动从 npm 拉取推荐插件（搜索 `dsh-plugin` 关键词，经 jsDelivr 抓取源码）
- 支持远端 registry（GitHub raw 等）与 `npm:搜索词` 两种市场源
- 一键安装：组合插件（preset-plugin）永久写入「我的插件集」预设组合（`standard-plugins`，自动创建），技能（skill）写入 `$DSH_HOME/skills/<name>/SKILL.md`
- 内置演示目录（会话计时器 / now_iso 工具 / 中文提交规范技能 / 动态试用）
- 所有网络请求由宿主执行（宿主 `shell` 服务 + `curl.exe`），浏览器端零网络调用

## 安装（永久，重启保留）

1. 安装本包到你的 dsh 部署（例如部署根目录）：

   ```sh
   npm install --prefix <部署目录> <本包 tarball 或 registry>
   ```

   （包名解析走 Node 规则：包放在部署 `node_modules/` 下即可）

2. 在 `$DSH_HOME/cordis.patch.yml`（机器级宿主补丁层，dsh 会热加载；没有则新建）追加一行：

   ```yaml
   - id: plugin-marketplace
     name: dsh-plugin-marketplace
   ```

3. 无需重启：宿主补丁层被实时监听，面板随即出现在「设置 → 插件市场」与侧边栏底部胶囊入口。

## 发布给别人用

把你的插件集合做成远端仓库：在 GitHub 建仓库，放一个 `registry.json`（格式见 `registry.example.json`），
再放各条目的源码文件。用户在市场面板「市场源」粘贴
`https://raw.githubusercontent.com/<用户>/<仓库>/<分支>/registry.json`，点「拉取」即可浏览和一键安装。

`kind` 取值：

- `preset-plugin`：组合插件，`file` 指向 ESM 源码（`export default { name, apply(ctx) {...} }`）
- `skill`：技能，`file` 指向 markdown 正文（安装时自动补 YAML frontmatter）
- `dynamic-plugin`：动态试用，`file` 指向 `{ "host": "...", "client": "..." }` 的 manifest JSON

## 环境要求

- 宿主组合提供 `fs`、`agentPresets`、`sandboxPolicy`、`webServer` 服务（标准 dsh 部署默认具备）
- 宿主提供 `shell` 服务且机器可出网（Windows 自带 `curl.exe`）；没有网络时面板会显示诊断，内置与本地仓库仍可用

## 本地仓库

市场面板会自动加载当前工作区 `.plugin-marketplace/registry.json`（`file` 为相对路径），
条目在面板中标记为「本地仓库」。
