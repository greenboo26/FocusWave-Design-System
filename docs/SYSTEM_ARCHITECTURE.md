# FocusWave System Architecture

## Product definition

FocusWave is a daily focus companion for study and work. The user starts a focus session, the RS6240 senses physiological micro-motion in the background, a released attention model produces continuous state estimates, and the interface turns those estimates into an understandable, calm and useful focus experience.

The product experience is organized around daily focus sessions, live state awareness, gentle regulation, session reflection and longitudinal insight.

The research program and the consumer-facing product form two connected systems with a formal release boundary.

## Two-system architecture

```text
RESEARCH / MODEL DEVELOPMENT

SART + probes + mmWave + RGB/NIR + validation data
                    ↓
        signal/feature research pipeline
                    ↓
        model training and comparison
                    ↓
      calibration + validation + testing
                    ↓
             Model Release Gate
                    ↓
              ModelBundle vX.Y

====================================================
             RELEASE / DEPLOYMENT BOUNDARY
====================================================

DAILY FOCUS PRODUCT

RS6240
  ↓
Live Acquisition
  ↓
Released preprocessing specification
  ↓
Feature windows
  ↓
Mature Model Inference
  ↓
Quality + confidence policy
  ↓
Continuous AttentionState stream
  ↓
Experience Engine
  ├── live artistic mmWave field
  ├── focus status and trend
  ├── optional regulation cue
  ├── session summary
  ├── history / personal baseline
  └── AI cultural/text layer
```

## ModelBundle: the contract between research and product

The web application consumes a versioned model release rather than participating in model training.

A ModelBundle contains:

- `model_version`
- trained model artifact / weights
- preprocessing specification
- input feature schema
- required window lengths and update cadence
- normalization / scaling parameters
- output state schema
- confidence calibration
- data-quality gating policy
- supported device / firmware profile
- validation summary
- intended-use scope
- reference / norm version when applicable

The complete bundle is versioned so every session can be traced to the exact algorithm that produced its state estimates.

## Daily product layers

### 1. Focus Session Layer

Creates a normal study/work focus session.

Typical user inputs:

- session title or task
- planned duration
- optional focus goal
- visual theme preference
- regulation preference

The system records session start/end, pauses, user-triggered breaks and interaction events required for the product experience.

### 2. Device & Presence Layer

Connects RS6240 and establishes a usable sensing condition.

Outputs:

- device connection
- target presence
- target distance / range support
- signal quality
- baseline readiness
- streaming health

### 3. Signal Runtime

Executes the preprocessing specification shipped with the active ModelBundle.

Primary outputs can include:

- target/range support
- unwrapped phase
- respiration representation
- cardiac micro-motion representation
- movement/micro-motion features
- quality / coverage features
- model-ready feature windows

### 4. Mature Model Inference

Loads the released model artifact and converts valid feature windows into continuous attention-state estimates.

Every output includes:

- state vector
- user-facing state class or region
- confidence
- quality
- model version
- source window

### 5. Experience Engine

Transforms the structured state stream into the FocusWave experience.

It drives:

- mmWave-derived artistic line field
- state title and short interpretation
- palette and imagery behavior
- live trend
- gentle state transitions
- regulation entry

### 6. Session Insight Engine

Summarizes a completed work/study session into useful daily feedback such as:

- focused duration
- stable-focus segments
- fluctuation pattern
- recovery episodes
- state trajectory
- signal-quality coverage
- comparison with the user's own previous comparable sessions

Reference-population interpretation is introduced only when the relevant norm has passed the required validation stage.

### 7. History & Personal Baseline

Builds a longitudinal view of the user's focus patterns across days and contexts.

The primary comparison is within-person change across comparable sessions. Population references can appear as an additional validated layer.

### 8. Regulation Layer

Offers opt-in support when the state model identifies a sustained drift or low-arousal pattern with sufficient confidence.

Possible responses include:

- subtle palette/brightness adjustment
- short visual reset
- rest suggestion
- breathing or sensory regulation module
- return-to-task transition

The system records pre/post state trajectories so each regulation method can later be evaluated empirically.

### 9. AI & Cultural Layer

Receives the structured product state after scientific inference and creates the human-facing language layer:

- FocusWave original short lines
- verified literary/philosophical excerpts
- multilingual text with translation
- session-summary explanation
- imagery selection

### 10. Research Release Console

A separate researcher-facing workflow prepares deployable model releases. It manages model validation, version metadata and release manifests. Daily users interact only with approved released versions.

## Product screen family

```text
Home / Today
├── Start Focus Session
│   ├── Device Ready
│   └── Live Focus
│       ├── Focus Landscape
│       ├── Detail / Evidence
│       └── Regulation
├── Session Summary
├── History / Insights
├── Attention Portraits
├── Training / Regulation Library
└── Settings
    ├── Device
    ├── Privacy & Storage
    ├── Visual / Cultural Theme
    └── Model & Data Information
```

## Scientific deployment principle

Research determines which signals and models are valid. Product runtime reproduces the released preprocessing and inference contract exactly. The visual, AI and interaction layers consume the resulting `AttentionState` object and remain downstream from the measurement algorithm.

A model trained mainly in SART becomes a daily-use model after ecological / cross-task validation demonstrates sufficient transfer to ordinary study and work contexts. This validation result is part of the ModelBundle release scope.