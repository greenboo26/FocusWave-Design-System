# 仓库与三个分支说明

核对日期：2026-10-09。依据为远程分支、当前源文件、发布工作流和浏览器实测。这里的网页是交互原型，状态、档案和趋势中的示例数据不能作为传感器接入或科学验证的证据。

## 分支职责

| 分支 | 用途 | 更新方式 |
| --- | --- | --- |
| `main` | GitHub 默认入口，保存验收后的代码和文档 | 从验收后的 `li` 快进同步，保留提交历史 |
| `li` | 当前网页开发与发布线 | 核验后正常提交、推送；唯一可发布 Pages 的分支 |
| `arena/01a0cc25-focuswave-design-system` | 候选功能工作分支 | 保留独有提交，逐项核验后再决定是否整合 |

整理前的远程快照：

| 分支 | 提交 | 与发布线的关系 |
| --- | --- | --- |
| `main` | `b84dd600305b0eb630b33bf94a0721d92461ae9a` | 比 `li` 少 111 个提交，没有独有提交 |
| `li` | `dab62fc31a1c7dee7928b849963499ea4f197775` | 当时线上字体与档案加载修复版本 |
| `arena/01a0cc25-focuswave-design-system` | `e6b98ff31dce179bd21fe7be87dc112f6b5b21a8` | 与 `li` 分叉：当时 `li` 独有 3 个、候选线独有 4 个提交 |

此表保留整理前的历史证据，后续实时关系用下述审计命令查看。工作分支的共同祖先为 `2766fdcb89bf249a2eee6b2a976d78d59bf5df59`。所有分支和历史均保留。

## 候选分支的四个独有提交

| 提交 | 源码变化 | 验收状态 |
| --- | --- | --- |
| `136bdae` | 计划时长结束自动完成、构建脚本执行位置、可访问性与页面元信息 | 已检查差异；自动完成流程尚未在发布线验收 |
| `3c32daa` | 可选 AI 回顾卡、白噪音开关、设置导出，练习弹层期间阻止自动结束 | 已检查差异；尚未整合、实测 |
| `109f0be` | 多处减少动态偏好、离页暂停池塘、总结时长保护 | 已检查差异；尚未整体整合、实测 |
| `e6b98ff` | 首页文字模式连接原创、生成、古典与世界文学内容库 | 已检查差异；发布线首页仍只读取精选引言库 |

这条候选线没有发布线最新的站点字体和档案依赖顺序修复，不能直接替换线上目录。其设计决策编号 D-024 与发布线字体决策同号，整合时须保留两条内容并重编号。本次只单独采用了构建脚本在原入口位置执行的修复，并对当前源页面和生成页面核验；其余候选功能继续保留。

## 目录与实际入口

| 路径 | 职责与当前状态 |
| --- | --- |
| `prototype/daily-focus-v1/index.html` | 线上源入口，使用 HTTP 服务；包含今日、洞察、档案、画像、练习、设置六项导航 |
| `prototype/daily-focus-v1/*.js`、`*.css` | 页面运行时、绘图、控制器与样式；`settings-controller.js` 还会按页面加载模块 |
| `prototype/daily-focus-v1/FocusWave-standalone.html` | 生成产物，内联部分模块与精选引言；仍依赖相邻资源，推荐通过 HTTP 查看 |
| `prototype/daily-focus-v1/content/` | 随网站发布的内容资产，首页目前使用 `curated-quotes.json` 的 20 条精选引言 |
| 根目录 `content/` | 早期内容种子与语义规范，三份 JSON 与原型中的扩充版本不同，不可覆盖发布目录 |
| `system/` | 字体、色彩、意象、文本等设计规范 |
| `docs/` | 设计决策、产品目标架构、实现计划、历史方案；目标架构不等于当前已接入功能 |
| `lab/` | 独立视觉实验及素材，主网页没有加载该目录中的实验脚本 |
| `archive/initial-prototype/` | 初始原型，保留作演进证据 |
| `scripts/audit-repository.cjs` | 三个分支的文件、语法、静态资源引用、内容副本差异审计，依赖 Node.js 与 Git |

当前洞察视觉为 `insights-ink-pond-v3.js`；档案由 `insights-archive*.js` 独立实现。枯山水文档及庭具素材属于历史设计与实验，不代表当前首页或洞察的活动渲染器。`insights-lotus-overlay.js` 当前是兼容空实现，用于避免重复绘制。

以下旧脚本没有从当前入口的静态引用图到达，保留作历史，未删除：`daily-garden-rewards.js`、`garden-interactive-sand.js`、`garden-materials.js`、`garden-real-sand-photo.js`、`garden-realistic-v2.js`、`garden-three-scene.js`、`garden-tools-v3.js`、`insights-ink-pond-v2.js`、`insights-ink-pond.js`、`insights-longterm.js`。计算生成的路径仍需人工检查，静态不可达不等于可以安全删除。

## 发布与验证

`.github/workflows/pages.yml` 仅允许 `li` 发布；手动运行也受分支条件限制。工作流复制原型目录，替换版本查询参数，并生成 `preview-<完整提交号>.html`。验收应核对部署成功、这个版本入口和实际渲染，不能仅依据根页面缓存或 Pages 设置中的历史 source 元数据判断版本。

本地预览：从仓库根目录执行 `python -m http.server 8899 --directory prototype/daily-focus-v1`，打开 `http://localhost:8899/`。生成页面：执行 `node prototype/daily-focus-v1/build-standalone.js`。仓库没有 `start-server.bat` 或 `sync-to-repo.bat`；直接修改本仓库源文件后提交即可。

只读审计：先执行 `git fetch origin`，再执行 `node scripts/audit-repository.cjs --output <报告路径.json>`。报告包含远程提交与分叉关系、各分支 JavaScript 语法与 JSON 解析、入口静态资源引用、旧脚本和内容副本差异。它不会切换或修改分支；语法通过不能代替交互、设备或科研验证。

本次核验包括六页标题字体、完整档案视图、练习五种动态图形、切页恢复及练习弹层；其他候选分支功能的验收状态如上表。素材再生成脚本 `build-lotus-assets.js` 依赖单独的浏览器工具与本机环境，普通预览和审计无需运行它。
