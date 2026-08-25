# Research & Design References

本文件只记录实际用于设计讨论的参考。后续新增来源时，需要同时写明“参考了什么”，避免把链接堆成没有决策意义的书目。

## A. 产品与视觉参考

### The Mind Company

来源：用户提供的页面截图。

参考点：

- 极大留白
- 单一视觉中心
- 小量文字与对象之间的尺度对比
- 不依赖卡片堆叠

取舍：吸收留白与视觉重心方法，不复制其手机 mockup 或具体图形。

### Headspace / Calm / Balance

参考点：冥想与专注产品如何降低信息密度、提供情绪入口、使用柔和配色。

取舍：初版受到这一类产品影响，但后续明确减少“wellness app”感，不采用呼吸圆作为首屏品牌核心。

### Endel

参考点：实时状态 / 声音与生成视觉之间的绑定思路。

取舍：借鉴“状态驱动生成内容”，但 FocusWave 的视觉必须来自毫米波数据结构，而非纯生成动画。

### Forest

参考点：用单一隐喻表现专注过程。

取舍：借鉴“状态可以通过一个持续变化的隐喻表达”，但 FocusWave 不采用游戏化树木成长，而采用数据流场。

### 枯山水 / Karesansui

参考点：留白、耙砂线条、局部回旋、有限痕迹表现不可见流动。

取舍：只吸收视觉思想。明确拒绝把石头、砂池、禅寺等实体元素直接拼进 UI。

---

## B. 字体参考

### LXGW WenKai Screen / 霞鹜文楷屏幕阅读版

https://github.com/lxgw/LxgwWenKai-Screen

参考点：原版文楷针对 PC / Android 屏幕偏细的问题，通过字重与度量调整提升屏幕阅读适配性。

设计意义：支持“人文层使用现代文楷，而不是系统楷体”的方向。

### 仓耳今楷

参考点：现代屏显环境中的楷体 / 今楷设计方向。

设计意义：作为状态标题与文学短句的候选风格，不直接决定最终字体。

---

## C. 颜色与认知 / 注意研究

### Mehta, R., & Zhu, R. J. (2009)

**Blue or red? Exploring the effect of color on cognitive task performances.** *Science, 323*(5918), 1226–1229.

DOI: https://doi.org/10.1126/science.1169144

用于设计讨论的结论：研究报告红色更偏细节导向任务、蓝色更偏创造性任务；说明颜色效应与任务类型有关，而不是简单“某色=更专注”。

### Maier, M. A., Elliot, A. J., & Lichtenfeld, S. (2008)

**Mediation of the negative effect of red on intellectual performance.** *Personality and Social Psychology Bulletin, 34*(11), 1530–1540.

DOI: https://doi.org/10.1177/0146167208323104

用于设计讨论的结论：红色在成就任务情境中可能关联回避动机与局部加工。该结果不能被直接转化为产品中的固定红色禁用规则。

### Gnambs, T. (2020)

**Limited evidence for the effect of red color on cognitive performance: A meta-analysis.** *Psychonomic Bulletin & Review, 27*, 1374–1382.

DOI: https://doi.org/10.3758/s13423-020-01772-1

关键意义：后续证据显示“红色损害认知表现”的效应并不稳健；推理任务出现小效应，但校正发表偏倚后证据进一步减弱。因此 FocusWave 不能宣称固定颜色具有确定认知效果。

### Soltanzadeh et al. (2024)

**Color and brightness at work: Shedding some light on mind wandering / sustained attention.**

PubMed: https://pubmed.ncbi.nlm.nih.gov/39295080/

用于设计讨论的结论：高亮度蓝色条件在该研究中与更好的持续注意和较低的走神相关神经活动有关。

设计边界：这是特定实验条件结果，不足以把“蓝色”写成通用专注处方；亮度本身也是重要变量。

### Lee et al. (2021)

**In search of blue-light effects on cognitive control.** *Scientific Reports*.

用于设计讨论的结论：蓝光并未稳定增强或损害其研究条件下的认知控制，进一步支持“颜色效应依赖任务和参数”的保守立场。

---

## D. 当前证据使用规则

1. 文献用于限制设计主张，不用于给配色增加伪科学权威。
2. 区分色相、亮度、饱和度、环境光与屏幕 UI 颜色；这些不是同一个操纵。
3. 将颜色调节写作“文献启发型”而非“已验证干预”。
4. 真正的调节效果应在 FocusWave 自己的数据上进行被试内或 A/B 验证。
5. 后续每个颜色策略需记录：研究来源、实验情境、样本、任务、操纵方式与可迁移性风险。
