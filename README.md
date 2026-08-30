# FocusWave Design System

FocusWave 的独立设计与产品架构仓库，用于沉淀界面原则、视觉语言、研究依据、设计决策、运行架构、原型演进与可实现规范。

## 产品定位

FocusWave 是面向日常学习与工作的毫米波专注伴侣。RS6240 在后台进行非接触感知，研究阶段发布的成熟 `ModelBundle` 在本地运行时中生成连续 `AttentionState`，产品将其转化为实时状态感知、艺术化数据表达、可选调节、会话总结、长期洞察与专注画像。

研究系统负责训练和验证模型；日常产品负责执行已发布模型的推理链。

## 工作方法

设计从目标状态出发：先定义界面应该呈现的结构、行为、气质和数据含义，再定位影响目标的根因，随后直接改写上层规则与相关系统文档。

所有设计规范采用肯定式描述，明确写出“应该是什么、如何表现、由什么驱动、如何验证”。这套表达方式让设计协作者和生成式模型围绕目标结构工作。

## 当前仓库结构

### 设计与研究

- `archive/initial-prototype/`：最初收到的界面原型，作为设计演进基线保存。
- `docs/DESIGN_PRINCIPLES.md`：当前设计原则与目标状态。
- `docs/DESIGN_DECISIONS.md`：关键设计决策及其正向理由。
- `docs/WORKING_METHOD.md`：根因修复、肯定式规格与协作方法。
- `docs/RESEARCH_REFERENCES.md`：字体、色彩、注意调节、文化意象等参考来源及其实际设计用途。

### 产品架构

- `docs/SYSTEM_ARCHITECTURE.md`：研究模型发布链与日常产品推理链。
- `docs/PRODUCT_MODULES.md`：Today、Live Focus、Insights、Portraits、Practice、Settings 等模块。
- `docs/PRODUCT_INFORMATION_ARCHITECTURE.md`：完整页面层级与日常用户流程。
- `docs/PRODUCT_RUNTIME_ARCHITECTURE.md`：RS6240、本地 Runtime、ModelBundle、WebSocket、浏览器与 AI 内容层。
- `docs/SIGNAL_DATA_PIPELINE.md`：产品实时信号与状态消息链。
- `docs/RESEARCH_PRODUCT_BOUNDARY.md`：SART 研究验证系统与日常产品的正式发布边界。
- `docs/IMPLEMENTATION_ROADMAP.md`：产品实现与研究模型发布的双轨路线。

### 视觉系统

- `system/VISUAL_LANGUAGE.md`：FocusWave 的核心视觉语法。
- `system/MMWAVE_VISUAL_MAPPING.md`：毫米波数据到视觉参数的映射。
- `system/COLOR_IMAGERY_SYSTEM.md`：意象、色域与状态调节规则。
- `system/TYPOGRAPHY.md`：数据层与人文层字体系统。
- `system/TEXT_QUOTE_ENGINE.md`：原创短句、经典文本、翻译与语义匹配规则。

### 可交互原型

- `prototype/daily-focus-v1/index.html`：第一版日常 FocusWave 可交互网页。当前跑通 `Today → Session Setup → Device Ready → Live Focus → Session Summary`，并包含 Insights、Portraits、Practice、Settings。
- `prototype/daily-focus-v1/README.md`：原型目标、数据源与后续接入说明。

## 当前旗舰体验

Live Focus 以大面积暖白留白建立呼吸感。左侧承载状态与人文文本，右侧由毫米波/状态数据生成的大尺度细线流场承担主视觉，底部以 `Focus Index / Confidence / Data Quality` 提供轻量科学锚点。

山、海、竹、雨、云、线香、花、月等意象通过流线几何、节律、色域和文字语义进入系统。数据本身始终承担视觉主体。

## 当前开发状态

`daily-focus-v1` 已从静态效果图进入可交互网页阶段。当前使用 schema-compatible `AttentionState` 模拟器开发交互和视觉；未来成熟 ModelBundle 接入本地 Runtime 后，浏览器继续消费同一类结构化状态消息。

当前原型已补齐桌面侧栏与移动端底部一级导航，Reflection Mode 页面共享同一导航状态，Live Focus 继续保持低干扰的沉浸模式。会话总结新增可选 AI 回顾原型：当前以本地模板展示加载、完成、失败与来源记录状态；正式 provider 将通过可替换适配层接入，默认只接收结构化 `SessionSummary`，不接收原始毫米波。
