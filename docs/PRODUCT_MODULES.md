# FocusWave Product Modules

## Product role

FocusWave is a daily focus companion for study and work. The browser application uses a released attention model to transform live RS6240 sensing into state awareness, regulation, reflection and long-term insight.

## Module map

### M1. Home / Today

Purpose: give the user a calm entry into today's focus activity.

Functions:
- current device readiness
- today's accumulated focus time
- recent focus trend
- resume / start session
- recent Attention Portrait
- concise AI/humanistic reflection

### M2. Start Focus Session

Purpose: begin an ordinary study or work session.

Functions:
- task/session title
- optional planned duration
- optional focus goal
- visual theme
- regulation preference
- start / pause / finish

### M3. Device Ready

Purpose: establish a reliable RS6240 sensing condition before live inference begins.

Functions:
- RS6240 connection
- target presence
- target distance support
- signal quality
- baseline readiness
- active ModelBundle version
- streaming health

### M4. Live Focus

Purpose: become the flagship everyday experience during study/work.

Primary composition:
- large negative space
- left-side attention state and humanistic/cultural text
- right-side mmWave-derived generative line field
- lightweight Focus Index / Confidence / Data Quality
- session time

Live behavior:
- state evolves continuously
- imagery and palette respond to state and selected theme
- model confidence controls feedback certainty
- regulation entry appears through a restrained transition when appropriate

### M5. Detail / Evidence

Purpose: let interested users understand the signal basis behind the current state.

Functions:
- recent state timeline
- respiration representation
- movement / micro-motion
- signal quality / coverage
- available physiological features supported by the active model
- model version and update cadence

The default daily experience stays simple; this page provides transparency and depth.

### M6. Regulation

Purpose: support a return to stable engagement when the released model detects sustained drift, fatigue or instability with sufficient confidence.

Functions:
- visual reset
- color/brightness regulation themes
- short guided rest
- breathing / sensory regulation when configured
- user choice of intervention
- recovery trajectory
- pre/post comparison

### M7. Session Summary

Purpose: turn one completed study/work period into an understandable reflection.

Sections:
- total session duration
- effective sensing coverage
- stable-focus duration
- fluctuation trajectory
- recovery episodes
- focus rhythm across the session
- personal-baseline comparison
- Attention Portrait
- concise explanation / cultural text

### M8. History / Insights

Purpose: support longitudinal self-understanding.

Functions:
- day/week/month timeline
- session comparison
- task/context tags
- within-person baseline
- focus rhythm by time of day
- recovery patterns
- repeated Attention Portrait gallery
- validated reference comparison when available

### M9. Attention Portraits

Purpose: turn a session into a memorable data artwork generated from the same state and mmWave-derived features.

Functions:
- 2D session portrait
- optional 3D interactive portrait
- rotate / inspect / replay
- state-region annotations
- session metadata

### M10. AI & Cultural Content

Purpose: create the human-facing semantic layer after mature model inference.

Functions:
- FocusWave original short-line generation
- verified literary/philosophical quote retrieval
- multilingual text + Chinese translation
- state-to-imagery selection
- session-summary wording
- personalized tone preference

### M11. Training / Focus Practice

Purpose: provide optional focus practice that uses the mature model as real-time feedback.

Functions:
- short focus exercises
- feedback-driven regulation practice
- recovery practice
- progress history
- pre/post state comparison

This is a user training experience. Machine-learning model training belongs to the research release pipeline.

### M12. Settings / Trust

Purpose: make device, privacy and algorithm state understandable.

Functions:
- device configuration
- storage and privacy controls
- visual/cultural theme preference
- feedback sensitivity
- AI content preference
- active model version
- model intended-use information
- data export / deletion controls

## Product navigation

```text
Today
├── Start Focus
│   ├── Device Ready
│   └── Live Focus
│       ├── Detail / Evidence
│       └── Regulation
├── Session Summary
├── History / Insights
├── Attention Portraits
├── Training / Practice
└── Settings / Trust
```

## Research / product boundary

The research program uses SART, probes, RGB/NIR and other validation data to train and validate the attention algorithm. A validated `ModelBundle` is then released to the daily product. The product consumes that frozen inference package during ordinary study and work sessions.