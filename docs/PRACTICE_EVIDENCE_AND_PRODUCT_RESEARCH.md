# Practice Module — Evidence & Product Research

## Product goal

FocusWave Practice serves ordinary study/work users who want to recover from distraction, prepare for a focus session, or practice sustained attention with live feedback from a released ModelBundle.

The practice library is organized around evidence-supported attentional skills and mature product interaction patterns. Each practice has a clear purpose, duration, interaction cost and evidence label.

## Product references

### Headspace

Official Focus content combines short mindfulness exercises, breathing-based resets, focus meditation, focus timers and long-form focus music. The current Focus library includes Quick Focus Resets such as 3–10 minute mindful activities, short focused-breathing exercises, body scans, work/study content and long focus timers.

Reference:
- https://www.headspace.com/focus-mode
- https://www.headspace.com/content/categories/focus
- https://www.headspace.com/content/meditation/focus/154

Design lesson for FocusWave:
- provide a short reset path and a longer practice path;
- keep entry friction low;
- let users choose duration;
- separate active guided practice from passive focus-session support.

### Balance

Balance personalizes meditation according to goals and experience. Its Foundations program trains focus by concentrating on breathing and noticing body sensations; plans and short Singles are separated so users can choose structured learning or a short one-off practice.

Reference:
- https://support.balanceapp.com/hc/en-us/articles/4407700854171-What-is-Balance
- https://support.balanceapp.com/hc/en-us/articles/4407712529691-What-is-the-difference-between-Plans-and-Singles

Design lesson for FocusWave:
- personalize recommendations using user state/history;
- retain a compact set of clearly different practice types;
- distinguish progressive skill-building from one-off recovery tools.

### Endel

Endel organizes the experience into Focus / Relax / Sleep / Activity and uses real-time context to adapt soundscapes. Its desktop product emphasizes a streamlined, discreet interface and low interaction burden during work.

Reference:
- https://endel.io/
- https://endel.io/focus
- https://endel.io/technology

Design lesson for FocusWave:
- use sensor-derived state to adapt the experience rather than asking the user to configure many parameters;
- make the active focus experience quieter than the setup/library experience;
- keep regulation optional and context-sensitive.

### Brain.fm

Brain.fm organizes listening by task modes such as Deep Work, Learning and Light Work. Its design language emphasizes one-click entry and reduction of distracting UI. Its published white paper also describes avoiding gaps, breaks and abrupt acoustic changes that could capture attention.

Reference:
- https://www.brain.fm/
- https://www.brain.fm/pdfs/white-paper.pdf

Design lesson for FocusWave:
- continuous support should change slowly and predictably;
- the live visual field should have a long animation cycle and restrained state morphing;
- task choice should be simple and meaningful.

### Calm

Calm's focus guidance combines short meditation before a task, timers, focus-oriented audio and deliberate breaks. Its public guidance recommends starting with manageable focus periods and incorporating rest.

Reference:
- https://www.calm.com/blog/intentions/focus

Design lesson for FocusWave:
- preparation, sustained focus and recovery should be separate experiences;
- session duration should be user-controlled;
- breaks belong in the product loop rather than being treated as failure.

## Research evidence

### Focused-attention meditation

Focused-attention meditation trains sustained attention on an object such as the breath and repeated disengagement from distraction. A 2025 scoping systematic review describes FA as a foundational practice and reviews converging neurophysiological evidence, while also emphasizing heterogeneity and evidence gaps.

Lieberman JA et al. (2025). Neurophysiological mechanisms of focused attention meditation: A scoping systematic review. Imaging Neuroscience. PMID 40800838. DOI 10.1162/IMAG.a.14.

### Cognitive outcomes of mindfulness programs

A 2023 meta-analysis of 111 randomized controlled trials (n = 9,538) reported small-to-moderate effects across several cognitive outcomes including sustained attention, with smaller effects against active control conditions.

Whitfield T et al. (2023). Mindfulness enhances cognitive functioning: a meta-analysis of 111 randomized controlled trials. PMID 37578065.

### Brief mindfulness

A 2025 randomized experiment (N = 117) found that a brief mindfulness practice was associated with faster SART responses, fewer task-unrelated mind-wandering reports and improved flanker performance compared with an active control.

Hughes ZD et al. (2025). Examining the Impact of Brief Mindfulness Practice on Sustained Attention, Attentional Inhibition and Convergent Thinking. PMID 41003259.

Evidence for very short single-session mindfulness is mixed. A 2020 systematic review/meta-analysis found a small overall cognitive effect but no clear domain-specific attention effect, and a 2021 meta-analysis reported a non-significant pooled effect on attention. FocusWave therefore describes short resets as evidence-informed practices rather than guaranteed attention enhancement.

- Gill LN et al. (2020). Mindfulness induction and cognition: A systematic review and meta-analysis. PMID 32739799.
- Cásedas L et al. (2021). Does mindfulness-based intervention improve cognitive function? A meta-analysis of controlled studies. PMID 33582570.

### Acceptance during refocusing

A randomized study of 147 young adults found that a three-day mindfulness condition combining attention monitoring with acceptance produced less mind wandering than monitoring alone, relaxation and reading control conditions during a SART. This supports language that normalizes noticing distraction and returning without self-criticism.

Rahl HA et al. (2017). Brief mindfulness meditation training reduces mind wandering: The critical role of acceptance. PMID 27819445.

## FocusWave practice taxonomy

### P1 — 1 minute Arrival
Purpose: transition from the previous activity into the next focus period.
Method: posture awareness, one natural breath cycle, identify the task, enter Live Focus.
Role: preparation rather than meditation training.

### P2 — 3 minute Return
Purpose: recover after mild drift or before restarting work.
Method: notice current state → use natural breathing as an anchor → notice distraction → return gently.
Evidence position: evidence-informed brief focused-attention reset; claims remain modest.

### P3 — 5 minute Breath Anchor
Purpose: practice focused attention.
Method: sustain attention on natural breath sensation; each distraction becomes a repeated return event.
Evidence position: directly aligned with focused-attention meditation literature.

### P4 — 8 minute Breath + Body Anchor
Purpose: build a broader but stable attentional anchor.
Method: begin with breath, then include selected body sensations while preserving task-oriented alertness.
Evidence position: aligned with Balance-style Foundations practice and general mindfulness practice literature.

### P5 — 10 minute Return with Acceptance
Purpose: practice returning from distraction without adding frustration or self-evaluation.
Method: detect drift → name it briefly → allow it → return to breath/body anchor.
Evidence position: informed by experimental work separating attention monitoring and acceptance.

### P6 — Focus Block
Durations: 25 / 45 / 60 / free.
Purpose: real study/work rather than meditation.
Method: mature ModelBundle provides background state inference; FocusWave keeps UI quiet and only offers feedback according to the user's regulation preference.

## Practice recommendation logic

Recommendations can later use structured state/history:

- pre-session high fluctuation → P2 or P3;
- repeated drift with successful self-recovery → P5;
- first-time user → P1 then P3;
- stable user ready to work → Focus Block directly;
- low signal quality → resolve sensing quality before model-driven practice.

Recommendations are presented as optional suggestions. The user can always select another practice.

## Interaction specification

Each practice screen contains:
- one practice title;
- one concise goal statement;
- selectable duration where scientifically sensible;
- one primary Begin action;
- a minimal active-practice screen with timer, one instruction at a time and slow visual motion;
- Pause / End controls;
- a short completion reflection.

For model-driven practices, pre/post `AttentionState` and recovery time can be stored for later validation.

## Motion specification

The Live Focus line field uses a long animation cycle. The line geometry drifts slowly enough to function as ambient biofeedback rather than an attention target.

Prototype target:
- base wave phase cycle roughly 90–120 seconds;
- state morphology eases across roughly 15–30 seconds;
- ordinary model updates can occur faster internally while the visual layer interpolates;
- data-quality failures and explicit user actions can update immediately.

This separates scientific update cadence from perceptual motion cadence.
