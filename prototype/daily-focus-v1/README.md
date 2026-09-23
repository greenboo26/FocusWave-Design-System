# FocusWave Daily Focus Prototype v1

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

**方式二：起本地静态服务器（改代码时推荐）**

在本目录运行任意静态服务器，例如 `python3 -m http.server 8899`，
然后打开 http://localhost:8899/index.html 。
编辑源文件后刷新浏览器即可看到效果，无需重新构建。

---

## 改完之后

| 想做什么 | 怎么做 |
|---|---|
| 同步回 git 仓库 | 本目录就是 git 仓库内的工作副本，改动后照常 commit / push |
| 重新生成双击版 | 命令行执行 `node build-standalone.js` |

## 文件说明

| 文件 | 作用 |
|---|---|
| `FocusWave-standalone.html` | 自包含构建产物，双击即可打开 |
| `index.html` | 原版入口页，需要 http 环境 |
| `build-standalone.js` | 构建脚本：内联所有本地模块与引言库 JSON |
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
