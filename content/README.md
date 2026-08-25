# FocusWave Content Library

该目录保存产品运行时的人文文本资产。文本层只消费结构化 AttentionState，不参与科学推理。

## 内容层

- `original-state-lines.json`：FocusWave 原创状态短句，按主题 × 状态组织。
- `classical-zh.json`：中文古典文本，保留作者、作品、来源、版权状态与适用语义。
- `world-public-domain.json`：世界文学 / 哲思公版文本，保留原文、中文译文、来源和版权状态。

## 状态语义

- `stable`：注意稳定维持。语言功能是确认与陪伴。
- `drift`：注意开始漂移。语言功能是轻度觉察。
- `dispersed`：注意明显分散。语言功能是描述变化并降低评判感。
- `refocus`：注意重新回到任务。语言功能是承认返回过程。

## 选句逻辑

运行时先匹配 AttentionState，再匹配意象主题，再根据当前文字模式选择原创、中文古典或世界文学。经典文本只有 `verified=true` 才进入产品。引用显示作者与作品；翻译与原文分开存储。同一会话内记录最近展示项，降低重复率。

公版文本优先进入发布产品。现代版权作品先保存元数据与授权状态，完成授权评估后再展示正文。

## 心理学语言原则

FocusWave 将注意状态表达视为反馈语言，而不是诊断语言。稳定阶段确认当前状态；漂移阶段帮助觉察；明显分散阶段描述变化；回收阶段采用“发现—允许—返回”的语义结构。Monitor and Acceptance Theory 将 mindfulness 的核心机制拆为 monitoring 与 acceptance；Rahl 等人的随机实验显示，包含 acceptance 的简短训练组在后续 SART 上出现更少 mind wandering。因此回收语言采用接纳式表达，作为证据启发型产品设计。
