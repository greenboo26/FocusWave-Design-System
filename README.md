# FocusWave Design System

FocusWave 的独立设计与产品架构仓库，用于沉淀界面原则、视觉语言、研究依据、设计决策、运行架构、原型演进与可实现规范。

当前网页是使用模拟数据的交互原型。以下产品定位与架构描述的是目标设计；传感器、本地模型和外部 AI 服务的实际接入须在对应实现仓库单独验证。

## 分支与发布入口

| 分支 | 职责 |
| --- | --- |
| `main` | 默认入口，保存验收后同步的代码与文档 |
| `li` | 网页开发与发布线，唯一允许发布 GitHub Pages 的分支 |

候选分支 `arena/01a0cc25-focuswave-design-system` 的四个提交已通过合并记录保留；整合、修复及发布验收后删除该分支，后续只维护 `main` 与 `li`。

[在线原型](https://greenboo26.github.io/FocusWave-Design-System/) · [完整仓库说明与候选提交清单](docs/REPOSITORY_GUIDE.md) · [本地运行说明](prototype/daily-focus-v1/README.md)

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

- `prototype/daily-focus-v1/index.html`：日常 FocusWave 可交互网页。当前包含今日、洞察、档案、画像、练习、设置六项导航，以及准备、设备检查、专注过程和会话总结演示。
- `prototype/daily-focus-v1/README.md`：原型目标、数据源与后续接入说明。

## 当前旗舰体验

Live Focus 以大面积暖白留白建立呼吸感。左侧承载状态与人文文本，右侧由毫米波/状态数据生成的大尺度细线流场承担主视觉，底部以 `Focus Index / Confidence / Data Quality` 提供轻量科学锚点。

山、海、竹、雨、云、线香、花、月等意象通过流线几何、节律、色域和文字语义进入系统。数据本身始终承担视觉主体。

## 当前开发状态

`daily-focus-v1` 已从静态效果图进入可交互网页阶段。当前使用 schema-compatible `AttentionState` 模拟器开发交互和视觉；未来成熟 ModelBundle 接入本地 Runtime 后，浏览器继续消费同一类结构化状态消息。

当前原型已补齐桌面侧栏与移动端底部一级导航，Reflection Mode 页面共享同一导航状态，Live Focus 继续保持低干扰的沉浸模式。会话总结新增可选 AI 回顾原型：当前以本地模板展示加载、完成、失败与来源记录状态；正式 provider 将通过可替换适配层接入，默认只接收结构化 `SessionSummary`，不接收原始毫米波。

当前洞察使用第三版莲花池视觉；独立档案页展示示例统计、状态时间线和会话记录。木质庭具与枯山水脚本作为历史方案及实验保留。首页轮换海面、线香、山形三种持续运动效果。

原型内容目录包含 64 条人工原创、128 条离线生成短句、16 篇世界文学、16 篇中文古典及 20 条精选引言。设置中的四种文字模式已连接首页：极简、原创短句、世界文学、中文古典；快速切换只采用最后一次选择，生成短句保留审核与来源信息。根目录 `content/` 的早期种子不同于原型扩充库，不能互相覆盖。

有限计划时长到达后自动结束会话，打开调节或练习弹层期间延后结束。洞察莲花池离页暂停；白噪音开关与设置导出已连接。可选回顾使用本页显示的示例统计，新会话清空旧结果并拒绝旧会话的迟到响应；当前仍为本地模板。

标题与练习名称统一使用随站点发布的 Noto Serif SC 300 细字重。五种练习图形采用可见的缓慢呼吸与波动，主要周期约 8 秒；该周期只用于视觉，不规定用户呼吸频率。仓库结构、历史模块和验证边界见完整仓库说明。
