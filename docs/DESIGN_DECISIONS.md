# FocusWave Design Decision Log

该文件记录设计演进中被正式选定的方向、参考来源、选择理由与后续验证任务。后续 ChatGPT、Codex 与人类协作者可以直接从这些肯定式决策恢复设计上下文。

---

## D-001 首屏定位：实时数据作品

初版原型 `archive/initial-prototype/index.html` 建立了安静、克制、自然光感的基础气质。

当前首屏将毫米波数据提升为品牌主视觉，以数据艺术承担产品辨识度，以极简研究信息承担可信度。

---

## D-002 视觉中心：数据原生形态

FocusWave 的核心视觉来自毫米波信号与派生特征。品牌识别通过连续流场、局部扰动、非对称结构、节律变化和状态迁移形成。

选择理由：这种语言与产品传感方式直接相连，也能够形成长期一致的视觉资产。

---

## D-003 形态语言：有机、非对称、连续演化

流场保留真实数据中的局部差异、方向变化、相位错位和不完全规则性。整体结构保持克制，局部细节体现活的数据状态。

---

## D-004 首屏母版：留白 + 左文右波

当前母版采用：

- 近纸白背景与大尺度留白
- 顶部极简会话信息
- 左侧状态与人文文本
- 右侧毫米波细线流场
- 底部 Focus Index / Confidence / Data Quality

该空间骨架作为稳定品牌结构。主题变化集中在线场、色彩、文字和动态参数。

---

## D-005 枯山水转译：有限痕迹表现不可见流动

枯山水提供一种抽象方法：通过线性秩序、留白、回旋、疏密与局部重心，让有限痕迹表达看不见的流动。

FocusWave 将这一思想转译为毫米波数据线场，使“砂纹般的秩序感”来自数据本身。

---

## D-006 意象系统：数据行为主题

山、海、竹、雨、云、飞鸟、白马、蜻蜓、花、线香、月等意象进入五个视觉维度：

- 流线几何
- 流线节律
- 局部扰动方式
- 色域
- 状态短句与文化文本

意象因此成为可计算的视觉语法，并与真实毫米波特征共同生成画面。

---

## D-007 色彩系统：意象基础色 × 状态调节

系统覆盖冷色、暖色和中性色域。

示例：

- 海：雾蓝 / 灰蓝 / 珍珠白
- 山：苔灰 / 松绿 / 岩灰
- 竹：竹青 / 米灰 / 墨绿
- 雨：铅蓝 / 冷灰 / 月白
- 线香：浅赭 / 檀木灰 / 淡琥珀
- 夕照：淡杏 / 陶土灰 / 暮紫灰
- 花：灰粉 / 淡胭脂 / 嫩绿
- 夜：深靛 / 墨紫 / 银灰

意象决定基础色域；状态调节明度、饱和度、综合色比例、局部对比与统一程度。颜色干预以文献启发型设计假设进入实验验证。

---

## D-008 字体系统：数据层 + 人文层

状态标题与文学短句采用现代文楷 / 今楷方向，形成自然书写气质。数据、英文、时间、指标采用现代 UI 字体和数字字体，形成精确、轻量的研究语言。

原则：**数据是现代的，人文是有温度的。**

---

## D-009 Text / Quote Engine：跨文化人文反馈

文本系统包含三类内容：FocusWave 原创短句、审核过的经典文本、意象词与极短语。

经典文本显示原文、中文译文、作者与作品；原创文本显示 FocusWave 原创身份。文本数据库按语义、语言、唤醒度、状态、意象和审核等级组织。

---

## D-010 二维实时流场 + 三维 Attention Portrait

体验采用三层结构：

- 2D 流场：表达此刻状态
- 3D Attention Portrait：表达完整会话的数据画像
- Scientific Detail：展示 raw / features / quality / confidence 等证据

三层共享同一套数据映射规则。

---

## D-011 设计协作逻辑：肯定式目标规格

所有设计指令优先描述目标状态：界面由什么组成、视觉重心在哪里、元素承担什么语义、变化由什么数据驱动、效果通过什么方式验证。

协作流程采用“目标状态 → 根因机制 → 主规则重写 → 相关系统同步 → 验证”。这一规则同时适用于设计文档、生成式视觉提示词、前端实现和 Codex 任务说明。

---

## D-012 产品定位：日常学习与工作专注伴侣

FocusWave 的网页产品服务普通学习和工作场景。用户启动一个日常专注 session，RS6240 在后台进行无接触感知，系统持续呈现状态、趋势、调节入口、session 总结和长期画像。

研究中的 SART、思维探针、RGB/NIR 与实验标签承担模型训练、效度验证和模型发布的科研任务。产品信息架构围绕日常专注体验组织。

---

## D-013 算法接入：成熟 ModelBundle 推理

产品运行时接入已经完成训练、验证、校准和版本冻结的注意状态模型。

研究侧负责形成 `ModelBundle`，其中包含：

- 训练完成的模型 artifact / weights
- 对应的信号预处理规格
- feature schema
- normalization / scaling
- confidence calibration
- quality gating
- 设备与固件适配信息
- intended-use scope
- validation metadata
- norm/reference version（达到发布条件时）

产品侧执行该 ModelBundle 的实时推理，并将 `AttentionState` 交给视觉、历史、调节和 AI 内容层。

---

## D-014 研究 → 产品发布边界

采用双轨结构：

```text
研究轨：SART / probes / mmWave / RGB/NIR
        → 特征研究
        → 模型训练
        → 校准与验证
        → 真实学习/工作迁移验证
        → ModelBundle release

产品轨：RS6240 日常采集
        → released preprocessing
        → mature inference model
        → AttentionState
        → FocusWave experience
```

SART 训练出的模型需要通过普通学习/工作场景的迁移验证，发布范围与验证结果一同记录到 ModelBundle。

---

## D-015 产品信息架构：Focus Mode + Reflection Mode

产品采用两种交互密度。

**Focus Mode** 服务正在学习/工作的人，主要包含 Session Setup、Device Ready、Live Focus 与可选 Regulation。界面保持低操作密度，Live Focus 进入近全屏体验。

**Reflection Mode** 服务会话结束后的理解与长期追踪，主要包含 Session Summary、Insights、Attention Portraits、Practice 与 Settings / Trust。

一级导航固定为 `Today / Insights / Portraits / Practice / Settings`。日常主流程为：

```text
Today → Session Setup → Device Ready → Live Focus → Session Summary
```

---

## D-016 产品运行架构：本地感知 + 本地成熟模型推理

竞赛原型优先采用本地运行结构：

```text
RS6240
→ Sensor Service
→ released preprocessing
→ FeatureWindow
→ ModelBundle Runtime
→ AttentionState
→ local Realtime API / WebSocket
→ browser UI
```

毫米波采集、特征计算和注意状态推理在本地链路完成。AI / 文化文本属于可选内容服务，并以结构化 AttentionState 为输入。产品在仅使用本地审核文本库时也能完整运行。

---

## D-017 第一版可交互网页

`prototype/daily-focus-v1/index.html` 作为第一版日常产品原型建立。

当前跑通：

- Today
- Session Setup
- Device Ready
- Live Focus
- Detail / Evidence
- Regulation overlay
- Session Summary
- Insights
- Attention Portraits
- Practice
- Settings / Trust

Live Focus 使用 Canvas 动态线场；开发期由 schema-compatible `AttentionState` 模拟器驱动。未来成熟 ModelBundle 接入后，前端继续消费相同方向的结构化状态消息。

---

## D-018 当前工作队列

1. 审阅 `daily-focus-v1` 的页面结构与交互节奏，形成 v2 页面修改清单。
2. 将单文件原型拆为 React + TypeScript 产品工程。
3. 固化 `FocusSessionConfig / DeviceState / AttentionState / SessionSummary` schema。
4. 建立 FastAPI + WebSocket 本地 Runtime，让模拟状态通过真实传输协议进入网页。
5. 开发 RS6240 Sensor Service 与设备就绪状态机。
6. 对接研究轨发布的成熟 ModelBundle。
7. 继续完成真实毫米波参数 → 艺术流线映射，并定义 Attention Portrait 的 2D/3D 持久化格式。
8. 建立 AI / 文化文本数据库、审核流程与 provider adapter。
9. 实现 Regulation policy 与前后状态记录。
10. 持续记录每轮产品与视觉决策及验证结果。

---

后续每次形成实质设计决策，都用新的 D-xxx 条目记录被选定的目标方向、理由与验证结果。

---

## D-019 响应式产品外壳：共享页面状态，分别适配桌面与移动端

一级导航在 Today、Insights、Portraits、Practice、Settings 与会话总结之间保持连续。桌面使用固定侧栏；移动端使用固定底部导航；Live Focus 继续隐藏一级导航，只保留紧凑的会话控制。

导航按钮同步活动状态与 `aria-current`，键盘焦点可见，临时抽屉和遮罩支持 Escape 关闭。Insights 的沉浸式庭院保留原有视觉，但不再改变全站导航结构。

参考实现采用结构性学习而非视觉复制：

- [Radix Primitives](https://github.com/radix-ui/primitives) 的可访问、可组合基础组件原则；
- [shadcn/ui Sidebar](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/radix/ui/sidebar.tsx) 对桌面与移动端导航状态的分离管理。

---

## D-020 AI 接入：可选回顾、最小输入与可追溯生成

AI 在 FocusWave 中属于测量和会话聚合之后的解释层。实时专注继续优先使用低延迟、已审核的本地内容；AI 回顾只在会话结束后由用户主动生成，不进入毫米波测量、注意状态推断或分数计算。

原型采用 provider 可替换的 `FocusWaveAIAdapter`，并显式呈现等待、生成中、成功、失败与重试状态。默认输入为结构化 `SessionSummary`，排除原始毫米波和身份信息；每条结果保留 provider/runtime、模板版本、输入类型与生成时间。

参考实现：

- [Vercel AI SDK](https://github.com/vercel/ai) 的 provider 统一接口与结构化输出方向；
- [assistant-ui](https://github.com/assistant-ui/assistant-ui) 的可组合运行时、生成状态、重试与人工确认模式。

当前 Pages 原型明确标注“本地预览 · 未连接”，不会伪装成已接入外部模型。正式接入时，密钥保留在本地 Runtime 或服务端，不进入浏览器静态资源。

---

## D-021 线条必须表达状态，而不仅是装饰

首页线场从“切换时重绘”改为持续低速运动，并扩大稳定、游移、分散、回收之间的幅度、扰动与速度差。Live Focus 的雨、山雾、线香与夕照引擎同步提高可见对比和运动尺度，同时保留减少动态偏好。

长期趋势图使用专注指数主线、稳定片段辅线、个人平均虚线、趋势阴影、逐段绘制和悬停读数。会话参数图按注意状态分段着色：稳定为苔绿、游移为灰绿、分散为浅赭、回收为青绿，图线、背景区间和图例使用同一套映射。

## D-022 内容扩充采用批量生成与内部追溯

内容库新增“新创短句”类别。生成可以在专注之外批量完成，用户界面不在每条短句旁重复显示 AI 标签；条目内部仍保留生成方式、模板、时间和审核状态。正式内容入库前仍需筛选，生成内容不得充当测量结果或科学解释。

枯山水默认恢复实体版本：可见沙粒、绕石纹路、石体明暗与投影；编辑模式保留移动、细耙、中耙、粗耙、抹平、撤销和重置工具，不再用纯白平面覆盖基础场景。
