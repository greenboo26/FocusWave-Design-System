# FocusWave Long-term Insights Garden

## Purpose

长期洞察页承担 Reflection Mode 中的“时间沉积”体验。该页面使用独立的真实质感枯山水视觉场域，表达很多次专注经过时间累积后形成的个人庭院。

日常专注过程页继续使用 FocusWave 已确认的二维细线、低饱和和大面积留白语言。两类页面通过字体、排版、低饱和综合色、信息层级和交互克制度保持同一产品气质，视觉媒介保持各自完整。

## Current locked direction

### 1. Long-term page uses a dedicated physical scene

长期洞察页以真实沙面、耙纹、岩石、浅木框和自然阴影构成主要视觉。沙面采用接近中性白的石英砂观感，页面综合色保持冷静的暖白 / 中性灰，避免明显黄沙色。

### 2. First screen belongs to the garden

首屏以庭院为唯一主视觉。标题、奖励石头、编辑入口和长期摘要以轻量信息环绕庭院。深入趋势、模式比较和分析依据进入首屏以下的第二层。

首屏空间目标：

- 大尺度留白
- 宽幅庭院占据主要视野
- 统计条位于庭院下方，不覆盖沙盘
- 顶部信息保持稀疏
- 深入分析与主庭院形成明确纵向层级

### 3. Sand color and material

沙面目标为石英白 / 冷灰白，而不是米黄或暖黄色。实现采用低对比灰色砂粒、轻微沟槽阴影和白色高光建立物理起伏。

### 4. Garden is interactive

当前原型支持：

- 编辑庭院模式
- 石头拖拽摆放
- 耙纹工具直接在沙面绘制多道平行沟槽
- 整理工具清除用户新增耙纹
- 奖励石头加入庭院后继续自由摆放

交互承担“长期养成一个属于自己的对象”的产品机制，而不只是展示一张长期统计图。

### 5. Reward stones

奖励石头代表长期进步或阶段性成就。系统决定石头是否获得；用户决定获得后的空间位置。石头大小、轮廓与朝向存在变化，数量保持克制。

原型当前展示 `4 / 12` 的长期奖励进度，并允许通过奖励入口新增一颗随机形态石头用于交互演示。

### 6. System sediment and personal arrangement

系统数据沉积与用户个人布置承担不同角色：

- 系统长期状态决定基础砂纹的秩序、弯折与锚点关系。
- 用户操作决定奖励石头最终摆放位置和个人新增耙纹。

正式数据版本需要继续保留这两层来源，以避免个人编辑覆盖长期数据语义。

### 7. Deep analysis is second-level information

长期统计、Focus Index 变化和模式比较位于庭院首屏之后。模式条目可进入独立分析层，展示可比范围、比较组、描述性结果与解释边界。

页面叙事顺序为：

`长期拥有感 → 个人沉积 → 摘要 → 深入分析依据`

## Implementation

Current prototype file:

`prototype/daily-focus-v1/insights-longterm.js`

The long-term page is loaded through the existing FocusWave runtime chain and replaces only the `Insights` experience. Live / Today / Practice / Portraits retain their existing 2D visual system.

## Next validation

1. 在真实浏览器尺寸下检查首屏留白、庭院高度和统计条间距。
2. 检查石头 CSS 材质是否达到足够自然的岩石观感；需要时改为经过授权的实拍岩石资产。
3. 用真实长期 session 数据替换当前原型 HISTORY。
4. 明确奖励石头的真实触发规则，例如连续使用、稳定性进步、恢复效率改善或完成阶段目标。
5. 将系统生成砂纹与用户耙纹保存为独立数据层。
6. 检查移动端是否保留“庭院为主角”的视觉优先级。
