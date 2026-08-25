# Research & Design References

本文件记录真正进入 FocusWave 设计决策的参考来源，并说明每个来源贡献了什么设计方法、适用范围和验证任务。

## A. 产品与视觉参考

### The Mind Company

来源：用户提供的页面截图。

提取方法：

- 极大留白
- 单一视觉中心
- 小量文字与对象之间的尺度对比
- 编辑式空间节奏

FocusWave 将这些方法用于建立“左文右波”的静态骨架与单一视觉重心。

### Headspace / Calm / Balance

提取方法：

- 低信息密度
- 柔和色彩
- 情绪入口
- 长时间观看的舒适度

FocusWave 将这些方法用于控制信息密度和视觉刺激强度。

### Endel

提取方法：状态与生成内容持续绑定。

FocusWave 将这一机制用于“实时状态 → 数据视觉参数”的连续生成系统，并把毫米波真实数据作为形态来源。

### Forest

提取方法：用单一持续变化的隐喻表达专注过程。

FocusWave 将这一方法转化为连续流场与 Attention Portrait，使用户可以通过一个稳定的视觉语言理解状态变化。

### 枯山水 / Karesansui

提取方法：

- 留白
- 耙砂般的线性秩序
- 局部回旋
- 疏密变化
- 以有限痕迹表现不可见流动

FocusWave 将这些原则转译为毫米波数据线场的空间语法。

---

## B. 字体参考

### LXGW WenKai Screen / 霞鹜文楷屏幕阅读版

https://github.com/lxgw/LxgwWenKai-Screen

参考点：通过字重与度量调整增强 PC / Android 屏幕阅读适配性。

设计意义：支持“人文层使用现代屏显文楷”的方向。

### 仓耳今楷

参考点：现代屏显环境中的楷体 / 今楷设计方向。

设计意义：作为状态标题与文学短句的候选字体语言。

---

## C. 颜色与认知 / 注意研究

### Mehta, R., & Zhu, R. J. (2009)

**Blue or red? Exploring the effect of color on cognitive task performances.** *Science, 323*(5918), 1226–1229.

DOI: https://doi.org/10.1126/science.1169144

研究报告：红色条件与细节导向任务表现相关，蓝色条件与创造性任务表现相关。设计意义在于把“任务类型”纳入色彩策略，而非把色相单独视为注意状态标签。

### Maier, M. A., Elliot, A. J., & Lichtenfeld, S. (2008)

**Mediation of the negative effect of red on intellectual performance.** *Personality and Social Psychology Bulletin, 34*(11), 1530–1540.

DOI: https://doi.org/10.1177/0146167208323104

研究报告：红色在特定成就任务情境中与回避动机和局部加工过程相关。设计意义在于记录颜色的情境依赖性和任务依赖性。

### Gnambs, T. (2020)

**Limited evidence for the effect of red color on cognitive performance: A meta-analysis.** *Psychonomic Bulletin & Review, 27*, 1374–1382.

DOI: https://doi.org/10.3758/s13423-020-01772-1

研究结论：红色效应总体较小，任务间存在差异，后续研究的累计效应减弱。设计意义在于采用条件性、概率性的颜色调节假设，并把证据强度写入设计规则。

### Soltanzadeh et al. (2024)

**Color and brightness at work: Shedding some light on mind wandering / sustained attention.**

PubMed: https://pubmed.ncbi.nlm.nih.gov/39295080/

研究报告：高亮度蓝色条件在该实验中与更好的持续注意表现和较低的走神相关神经活动有关。

设计意义：把亮度与色相作为独立参数记录，并在持续注意场景中形成可检验假设。

### Lee et al. (2021)

**In search of blue-light effects on cognitive control.** *Scientific Reports*.

研究结果显示其条件下蓝光对认知控制的行为效应有限。设计意义在于强调任务、光谱、亮度、呈现方式和指标选择对结果解释的重要性。

---

## D. 证据使用规则

1. 每个设计主张记录对应证据与适用情境。
2. 色相、亮度、饱和度、环境光与屏幕 UI 颜色分别建模。
3. 颜色调节在产品中标记为“文献启发型设计假设”。
4. FocusWave 通过被试内实验或 A/B 形成自身的调节证据。
5. 每个颜色策略记录研究来源、实验情境、样本、任务、操纵方式、效应大小和迁移条件。
6. 设计文案的确定程度与证据等级保持一致。
