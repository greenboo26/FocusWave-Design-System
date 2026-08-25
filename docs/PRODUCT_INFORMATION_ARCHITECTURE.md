# FocusWave Product Information Architecture

## Product premise

FocusWave serves ordinary study and work. The user begins a focus session, RS6240 senses physiological micro-motion in the background, a released `ModelBundle` produces continuous `AttentionState`, and the product turns that state into calm awareness, optional regulation, session reflection and longitudinal insight.

The product has two interaction modes:

- **Focus mode**: minimal, immersive, low-interruption.
- **Reflection mode**: analytical, comparative, explanatory.

## Primary navigation

Desktop navigation uses five stable destinations:

1. **Today** — daily entry, device readiness, current focus rhythm, start/resume session.
2. **Insights** — session history, longitudinal trends, personal baseline, comparable-session analysis.
3. **Portraits** — 2D/3D Attention Portrait gallery and replay.
4. **Practice** — regulation and focus-practice library driven by released model feedback.
5. **Settings** — device, privacy, visual/cultural preferences, AI content, model information.

During an active focus session, the product enters a distraction-reduced full-screen state and temporarily replaces normal navigation with compact session controls.

## Core user journey

```text
Today
  ↓
Start Focus
  ↓
Session Setup
  ↓
Device Ready
  ↓
Live Focus
  ├── Detail / Evidence
  ├── Regulation (when useful and user-enabled)
  └── Pause / Finish
  ↓
Session Summary
  ↓
Save reflection / tag context
  ↓
Insights + Portraits
```

## 1. Today

### Goal

Answer three questions immediately:

- Is FocusWave ready?
- What is my focus rhythm today?
- What do I want to focus on next?

### Content hierarchy

1. Quiet greeting / date context.
2. Primary action: `开始一段专注`.
3. Device readiness as a compact status sentence.
4. Today's accumulated focused time and number of sessions.
5. One recent insight from the user's own history.
6. Most recent Attention Portrait preview.
7. Optional humanistic line generated from verified/approved content rules.

The page uses generous whitespace and one primary action rather than a dashboard grid.

## 2. Session Setup

### Goal

Start an ordinary study/work session with very little friction.

### Inputs

- task title, e.g. `写论文 / 阅读 / 编程 / 复习`
- planned duration: free focus / 25 / 45 / 60 / custom
- optional tag: study / writing / coding / reading / other
- visual theme: auto / ocean / mountain / bamboo / incense / dusk / moon
- regulation preference: quiet / gentle / active
- text mode: minimal / FocusWave original / global literature / Chinese classical

### Output

A `FocusSessionConfig` object used by the runtime and UI.

## 3. Device Ready

### Goal

Confirm that the sensing condition is suitable before inference begins.

### Primary feedback

- RS6240 connection
- presence detected
- distance support
- signal quality
- baseline readiness
- active ModelBundle

### Interaction

The page behaves like a calm pre-flight check. When quality reaches the required threshold for the active model, the session proceeds. The user can view a compact explanation of any item that still needs adjustment.

## 4. Live Focus

### Goal

Provide continuous awareness while preserving the user's attention on the real task.

### Stable mother layout

- warm white / paper-white field
- FocusWave mark at upper left
- session title + elapsed / planned time at upper center
- left: attention state, short interpretation, optional humanistic line
- right: mmWave/state-driven line field as the primary visual object
- bottom: lightweight `Focus Index / Confidence / Data Quality`

### Interaction density

Primary controls stay quiet:

- pause
- finish
- detail
- regulation

The interface updates gradually between model windows so state transitions feel continuous.

### State presentation

The released model publishes a continuous vector plus calibrated confidence. The UI converts it into user-facing regions such as:

- sustained / coherent engagement
- mild drift
- marked fluctuation
- refocusing
- low-arousal / fatigue-like pattern when supported by the released model

Labels and wording come from the active ModelBundle's validated output scope.

## 5. Detail / Evidence

### Goal

Provide scientific transparency without burdening the main focus experience.

### Content

- recent AttentionState timeline
- signal quality / coverage
- respiration representation when supported
- movement / micro-motion trend
- physiological features included in the released model
- current model version
- update cadence
- source-window timing

The page explains which values are directly measured, derived and model-inferred.

## 6. Regulation

### Goal

Offer an optional, low-friction return-to-task experience after a sustained state change with adequate confidence.

### Entry logic

The released product policy evaluates:

- state persistence
- confidence
- signal quality
- user preference
- time since the previous intervention

### Regulation families

- 20–60 s visual reset
- palette / brightness transition
- brief rest cue
- breathing or sensory pacing when selected
- return-to-task transition

### Measurement loop

Each regulation episode stores pre-state, intervention type, post-state and recovery time so future validation can assess whether the intervention helps.

## 7. Session Summary

### Goal

Turn one session into a concise and memorable reflection.

### Hero layer

A session Attention Portrait generated from the same data/state stream used during the live session.

### Summary dimensions

- session duration
- valid sensing coverage
- stable-engagement duration / proportion when supported
- state fluctuation trajectory
- recovery episodes
- strongest stable segment
- personal-baseline comparison
- user note / perceived focus rating

### Narrative layer

AI or the curated content engine receives the structured summary and produces a short explanation. Scientific numbers remain sourced from the ModelBundle/runtime.

## 8. Insights

### Goal

Help the user discover personal patterns across ordinary contexts.

### Views

- day / week / month
- comparable task types
- session duration bands
- time-of-day rhythm
- recovery pattern
- focus stability trend
- personal baseline
- signal-quality trend

The main reference frame is within-person change. Population reference appears as an additional layer only after validation and norm release.

## 9. Attention Portraits

### Goal

Create a durable visual memory of focus sessions and give FocusWave a distinctive product identity.

### Modes

- 2D line-field portrait
- 3D data relief
- session replay
- compare two portraits

The portrait geometry is generated from the recorded mmWave/state features and keeps a reproducible mapping version.

## 10. Practice

### Goal

Provide optional skill-building and regulation practice using live mature-model feedback.

### Programs

- short reset practice
- sustained-focus practice
- recovery practice
- paced work/rest routine

Practice history records state trajectories and response to each method.

## 11. Settings / Trust

### Sections

**Device**
- RS6240 profile
- firmware / runtime status
- connection test

**Privacy & Storage**
- local/cloud storage policy
- raw-data retention
- export
- deletion

**Experience**
- imagery theme
- text mode
- feedback sensitivity
- regulation preference

**AI & Content**
- curated-only / AI-assisted
- language preferences
- literary/cultural source preferences

**Model & Data Information**
- active ModelBundle
- intended-use scope
- validation summary
- update date

## Product-state objects

The UI is built around four stable runtime objects:

- `FocusSessionConfig`
- `DeviceState`
- `AttentionState`
- `SessionSummary`

Every screen consumes these objects rather than maintaining independent scoring logic.
