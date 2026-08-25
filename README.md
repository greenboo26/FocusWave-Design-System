# FocusWave Design System

FocusWave 的独立设计系统仓库，用于沉淀界面原则、视觉语言、研究依据、设计决策、原型演进与可实现规范。

## 工作方法

设计从目标状态出发：先定义界面应该呈现的结构、行为、气质和数据含义，再定位影响目标的根因，随后直接改写上层规则与相关系统文档。

所有设计规范采用肯定式描述，明确写出“应该是什么、如何表现、由什么驱动、如何验证”。这套表达方式让设计协作者和生成式模型围绕目标结构工作。

## 当前目标

建立一套以毫米波数据形态为核心，同时具备科学可解释性、人文表达与持续可扩展性的专注状态视觉系统。

## 仓库结构

- `archive/initial-prototype/`：最初收到的界面原型，作为设计演进基线保存。
- `docs/DESIGN_PRINCIPLES.md`：当前设计原则与目标状态。
- `docs/DESIGN_DECISIONS.md`：关键设计决策及其正向理由。
- `docs/WORKING_METHOD.md`：根因修复、肯定式规格与协作方法。
- `docs/RESEARCH_REFERENCES.md`：字体、色彩、注意调节、文化意象等参考来源及其实际设计用途。
- `system/VISUAL_LANGUAGE.md`：FocusWave 的核心视觉语法。
- `system/MMWAVE_VISUAL_MAPPING.md`：毫米波数据到视觉参数的映射。
- `system/COLOR_IMAGERY_SYSTEM.md`：意象、色域与状态调节规则。
- `system/TYPOGRAPHY.md`：数据层与人文层字体系统。
- `system/TEXT_QUOTE_ENGINE.md`：原创短句、经典文本、翻译与语义匹配规则。

## 当前首屏母版

首屏以大面积暖白留白建立呼吸感。左上保留 FocusWave 标识，顶部中央承载任务名、时间与 LIVE 会话信息；左侧承载状态名称与人文文本；右侧由毫米波数据生成的大尺度细线流场承担唯一主视觉；底部以 `Focus Index / Confidence / Data Quality` 提供轻量科学锚点。

山、海、竹、雨、云、线香、花、月等意象通过流线几何、节律、色域和文字语义进入系统。数据本身始终承担视觉主体。