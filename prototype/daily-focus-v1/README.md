# FocusWave Daily Focus Prototype v1

这是 FocusWave 日常学习/工作产品的第一版可交互网页原型。

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

## 运行

直接用浏览器打开 `index.html` 即可体验，无外部依赖。

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
