# FocusWave Daily Focus Prototype v1

## 2026-10-09 全站字体一致性修复

当前网站沿 `li` 分支发布。`heading-typography.css` 将 `--human` 与大标题字体统一为站点已有的 Noto Serif SC（简体中文衬线字体），一级至六级标题统一采用 300 细字重，练习名称、档案分区和弹层标题不再使用本机楷体。正文、导航、按钮和数字沿用原有无衬线字体。样式版本更新至 `v=2`，`FocusWave-standalone.html` 已重新生成。

本地浏览器已核对今日、洞察、档案、画像、练习、设置六页的标题及练习弹层，标题字体与字重一致，未发现标题水平溢出；浏览器的实际字体检查确认练习大标题和卡片名称来自同一站点字体，正文与按钮使用微软雅黑。构建与 `git diff --check` 通过。字体、布局和交互以外的规则未调整。截图作为本地核验产物，不纳入仓库。发布验收以对应提交的部署工作流成功、线上样式和入口版本一致为准。

## 2026-09-28 在线大标题字体更新

当前部署分支为 `li`。页面大标题改为 Noto Serif SC 300 细字重，字体文件随站点发布；正文、导航、数据与布局保持原样。样式入口为 `heading-typography.css`，字体及许可证位于 `assets/fonts/noto-serif-sc/`；同步更新了 `FocusWave-standalone.html`。

本地浏览器核验：已确认渲染字体来自站点字体文件（不是本机字体）；今日、洞察、档案、画像、练习、设置六个页面的大标题均采用 300 字重，未发现标题水平溢出。字体资源约 1.48 MB，预加载后用于全站标题。`git diff --check` 通过。

在线入口：https://greenboo26.github.io/FocusWave-Design-System/ 。修改只涉及展示层，不改变研究分析或模型状态。代码、字体、许可和生成页面纳入版本；浏览器截图保存在本地工作区，不入库。

这是 FocusWave 日常学习/工作产品的第一版可交互网页原型，
同时也是**不依赖 GitHub 的本地工作副本**。

---

## 本地怎么打开（重要）

GitHub 服务器不稳定，本目录已把站点所需的全部文件拉到本地，可直接离线查看和修改。

**方式一：双击 `FocusWave-standalone.html`（最省事）**

自包含构建产物，所有 JS 模块、莲花池素材、引言库数据都已内联，
用 `file://` 协议也能完整运行。直接双击就见效果。

> 原版 `index.html` 用了 ES module 动态 `import()` 和 `import.meta.url`，
> 这两者在 `file://` 下会被浏览器拦截，双击原版是白屏——所以才需要 standalone 版。

**方式二：双击 `start-server.bat`（改代码时推荐）**

自动起本地服务器并打开 http://localhost:8899/index.html 。
编辑源文件后刷新浏览器即可看到效果，无需重新构建。

---

## 改完之后

| 想做什么 | 怎么做 |
|---|---|
| 同步回 git 仓库 | 双击 `sync-to-repo.bat`，改动会复制回<br>`..\FocusWave-Design-System\prototype\daily-focus-v1\`，之后照常 commit / push |
| 重新生成双击版 | 命令行执行 `node build-standalone.js` |

## 文件说明

| 文件 | 作用 |
|---|---|
| `FocusWave-standalone.html` | 自包含构建产物，双击即可打开 |
| `index.html` | 原版入口页，需要 http 环境 |
| `build-standalone.js` | 构建脚本：内联所有本地模块与引言库 JSON |
| `start-server.bat` | 起本地服务器预览 |
| `sync-to-repo.bat` | 把本地改动同步回 git 仓库目录 |
| `*.js` / `*.css` | 各页面运行时（今日、洞察、画像、练习、设置） |
| `assets/inkpond/` | 莲花池素材：背景、鱼、三张莲花 PNG |
| `content/` | 引言与文案数据 |

> 说明：莲花奖励数据存在浏览器 `localStorage`，每天 24:00 自动清空，
> 与线上版本行为完全一致。

---

## 目标

把已经确认的视觉母版扩展为一个可点击的完整产品流程，并提前固定未来成熟 `ModelBundle` 的前端消费接口。

## 当前可体验流程

```text
Today
  ↓
Session Setup
  ↓
Device Ready
  ↓
Live Focus
  ↓
Session Summary
```

同时包含：

- Insights
- Attention Portraits
- Practice
- Settings / Trust

## 当前数据源

v1 使用前端 `AttentionState` 模拟器驱动 Live Focus。模拟器的数据结构与未来成熟模型输出保持同一方向：state vector / region / focus index / confidence / quality / model version。

后续接入真实系统时，前端状态源将替换为本地 Runtime 的 WebSocket，而页面结构与视觉映射保持稳定。

## 视觉基线

- 大面积暖白留白
- 数据流线承担核心视觉
- 人文层采用书写气质字体栈
- 数据层采用轻量现代字体
- 意象通过流线行为与色域进入界面
- Live Focus 维持左文右波母版

## 下一步

1. 拆分为 React + TypeScript 工程。
2. 建立 FastAPI + WebSocket 本地 Runtime。
3. 将当前模拟器迁移到 Runtime 端，固定真实消息协议。
4. 接入 RS6240 Sensor Service。
5. 接入研究阶段发布的成熟 ModelBundle。
