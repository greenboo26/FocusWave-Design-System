# mmWave → Visual Mapping

目标：让 FocusWave 的艺术流场由真实毫米波与派生特征驱动，形成可解释、可复现、可回放的数据艺术。

## 映射原则

1. 先保留数据结构，再进行审美压缩。
2. 每类视觉变化都记录明确的数据来源与参数变换。
3. 数据质量通过线场确定度、完整度和透明度表达。
4. 状态模型与信号质量模型分别驱动不同视觉维度。
5. 映射参数支持记录、复现、会话回放与 3D Attention Portrait。

## 第一版映射表

| 数据 / 特征 | 视觉维度 | 说明 |
|---|---|---|
| unwrapped phase | 主流线位移场 | 决定局部位置偏移与缓慢形变 |
| respiratory component | 大尺度曲率 / 周期 | 呼吸周期决定波峰间距，振幅决定大尺度起伏 |
| heartbeat micro-motion | 二级细纹 | 形成极细、低对比的微尺度纹理 |
| beat / IBI | 局部节律 | 调节细纹间距与局部节拍 |
| HRV | 微尺度节律变化 | 在质量充分的窗口中调节局部节律复杂度 |
| movement | 局部偏折 / 连续性 / 剪切 | 表达体动及其对当前窗口质量的影响 |
| coverage / valid-window | 透明度 / 完整度 | 有效覆盖决定线场可见程度与连续范围 |
| signal confidence | 线条确定度 | 置信度决定线条清晰度与稳定程度 |
| focus stability | 全局方向一致性 | 稳定程度决定长线连续性与全局流向一致性 |
| attention drift | 局部相位错位 / 小涡旋 | 游移程度决定局部扰动数量与外散幅度 |
| refocus transition | 秩序回收速度 | 表达局部扰动向统一流向恢复的连续过程 |

## 状态模型

`稳定 / 轻度游移 / 明显分散 / 重新聚焦 / 疲惫` 由状态模型或多指标组合产生。视觉层接收状态概率、状态持续时间、状态变化率与置信度，并将这些连续变量映射到流线参数。

## 数据质量层

数据质量层独立输出：

- coverage
- movement contamination
- target confidence
- signal continuity
- valid-window ratio

这些变量驱动线条完整度、清晰度、透明度和局部连续性，使用户能够从视觉上感知“当前画面有多确定”。

## 待实验确认

- 各视觉参数的最佳平滑时间窗
- 状态变化 hysteresis
- movement 与 attention 的统计解耦策略
- 质量分层对应的视觉确定度范围
- 2D 流场到 3D Attention Portrait 的空间定义
- 状态视觉变化对任务表现本身的潜在影响
