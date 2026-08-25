# FocusWave 成语线条语法 / Idiom Line Grammar

## 目标

FocusWave 的实时视觉由三层共同生成：

`意象主题 Theme × 注意状态 AttentionState × 成语笔法 IdiomGrammar`

主题决定基础空间与色域，状态决定速度、秩序与扰动强度，成语笔法决定局部线条如何运动、展开、分叉和回收。

成语在系统中承担“运动语法”的角色。视觉保持当前纸白、低饱和、细线、留白和连续流场的母设计，成语语义通过抽象线条行为出现。

## 第一批四种笔法

### 心无旁骛 / single-course

适配：`stable`

视觉语义：方向统一、连续、稳定、少量呼吸式起伏。

参数：
- directional_coherence: 0.94
- branch_strength: 0.05
- local_events: 0–1
- convergence: 0.72
- cadence: slow

线条行为：大多数线维持共同走向，局部扰动被主流场吸收，形成长而完整的连续轨迹。

### 走马观花 / passing-glance

适配：`drift`

视觉语义：快速掠过、短暂停留、局部展开。

参数：
- directional_coherence: 0.72
- branch_strength: 0.20
- local_events: 2–3
- lateral_sweep: 0.58
- petal_event: 0.46
- cadence: medium

线条行为：主流仍然连续，在少数位置形成短促的侧向加速；局部线束以 3–5 片非封闭弧线向外舒展，再被主流带走。花瓣只表现为曲率关系，不形成具象花朵。

### 心猿意马 / competing-currents

适配：`dispersed`

视觉语义：多方向牵引、节律分裂、局部相位差扩大。

参数：
- directional_coherence: 0.42
- branch_strength: 0.54
- local_events: 3–5
- competing_vector_fields: 2
- phase_offset: 0.62
- cadence: fast

线条行为：两个弱吸引方向同时作用于流场，形成错位、分叉与交错。整体仍保持连续细线和低对比，表现注意在多个方向之间竞争。

### 收心归一 / returning-one

适配：`refocus`

视觉语义：多线归并、扰动衰减、重新形成共同方向。

参数：
- directional_coherence: 0.80 → 0.94
- branch_strength: 0.26 → 0.06
- convergence: 0.84
- local_events: 1–2
- cadence: medium → slow

线条行为：前段保留少量分散痕迹，随后多股线逐渐向一个共同方向靠拢，局部曲率平滑，运动节律同步下降。

## 与四种主题的组合

同一个成语笔法在不同主题中保持语义一致，同时服从主题基础几何：

- 海：笔法作用于横向潮线、相位和局部涟漪。
- 山：笔法作用于层叠脊线、等高线间距和峰谷相位。
- 线香：笔法作用于上升轨迹、烟线偏转和卷曲半径。
- 夕照：笔法作用于地平线弧度、铺展方向和局部光带收束。

例如 `走马观花 × 海` 表现为潮线快速掠移与局部瓣状涟漪；`走马观花 × 山` 表现为山脊线在少数区域快速横移并展开浅弧；两者保持同一种“扫过—短停—离开”的注意语义。

## 状态速度

速度直接来自成熟模型输出映射后的 AttentionState：

- stable: 0.14
- drift: 0.42
- dispersed: 0.86
- refocus: 0.26，并在状态持续时继续向 stable 速度收敛

视觉设置中的“极静 / 缓慢 / 自然”作为全局倍率，状态间相对关系保持一致。

## 扩展候选

下一批语法：

- 浮光掠影：短促、浅层、低幅度的局部反射式扰动。
- 蜻蜓点水：单点触发的椭圆涟漪与快速恢复。
- 行云流水：长连续曲线与低阻力方向变化。
- 拨云见日：局部边界由模糊转清晰，线束逐步显露主方向。
- 水到渠成：多股弱流自然汇入既有主路径。

每个新增语法都定义语义、参数、主题适配和状态适配，并通过同一 Canvas grammar API 调用。