# FocusWave Product Modules

## Module map

FocusWave is organized around the full measurement workflow rather than a single screen.

### M1. Home & Session Setup

Purpose: start a measurement session with clear configuration and provenance.

Functions:
- participant/session identifier
- task protocol selection
- load-condition configuration
- device profile selection
- model/norm version display
- start/resume/import session

### M2. Device & Signal Calibration

Purpose: establish usable acquisition before the task begins.

Functions:
- RS6240 connection status
- frame-rate and channel status
- target/range-gate preview
- chest-position guidance
- live signal-quality score
- baseline recording
- synchronization status

### M3. Game-based SART

Purpose: run the standardized sustained-attention task and produce behavioral/probe labels.

Functions:
- game task presentation
- Go/No-Go responses
- block/load condition management
- mind probes
- rest stages
- event markers
- trial-level behavioral log

### M4. Real-time Monitor

Purpose: present the current attention state during live acquisition.

Primary view:
- large negative space
- left-side attention state and humanistic text
- right-side mmWave-derived line field
- Focus Index / Confidence / Data Quality

Secondary scientific drawer/view:
- HR
- IBI/HRV
- RR
- movement
- coverage
- processing latency
- state-model confidence

### M5. Signal & Evidence View

Purpose: expose the scientific basis behind the artistic result.

Functions:
- chest displacement waveform
- respiration waveform
- cardiac micro-motion / beat events
- motion events
- valid/invalid windows
- task/probe event overlays
- selected feature values
- provenance from visual state back to source window

### M6. Session Report

Purpose: convert the completed session into a structured assessment result.

Sections:
- summary portrait
- attention maintenance
- response stability
- state fluctuation
- behavioral performance
- physiological trajectory
- task-stage comparison
- probe-aligned state analysis
- reference comparison when a valid norm is available
- interpretation and data-quality notes

### M7. History & Longitudinal Tracking

Purpose: support repeat measurement and change-over-time interpretation.

Functions:
- session timeline
- comparable-session filtering
- trend charts
- repeated-state portrait gallery
- within-person baseline comparison
- longitudinal report export

### M8. Alert & Regulation

Purpose: support the "monitor → assess → feedback" loop described in the project plan and provide a path toward later training.

Functions:
- graded state notifications based on validated rules
- user-controlled regulation entry
- short visual/color regulation modes
- breathing/rest guidance when configured
- recovery-state tracking
- pre/post regulation comparison

### M9. Training

Purpose: provide an optional later-stage attention-training experience driven by real-time state feedback.

Functions:
- training protocol selection
- real-time state feedback
- regulation theme selection
- training-session score and trajectory
- longitudinal adherence/progress

### M10. AI Interpretation & Cultural Content

Purpose: translate structured results into natural, culturally rich feedback.

Functions:
- approved quote retrieval
- multilingual quote + Chinese translation
- FocusWave original short-line generation
- state-to-imagery selection
- report-language adaptation
- explanation generation from structured result JSON

Input contract contains only structured, versioned result fields. AI output is stored separately from measurement outputs.

### M11. Research & Admin Console

Purpose: make the system usable for experiments, validation and model development.

Functions:
- session metadata inspection
- raw/processed file browser
- processing-version audit
- feature-window inspection
- model inference replay
- norm-version management
- data-quality review
- export of aligned trial/physiology/probe tables
- model comparison and validation summaries

## Screen hierarchy

```text
Home
├── New Session
│   ├── Device Calibration
│   ├── Baseline
│   ├── SART Task
│   └── Live Monitor
│       └── Scientific Evidence View
├── Reports
│   └── Session Report
├── History
│   └── Longitudinal Trends
├── Regulation / Training
└── Research Console
```

The artistic live screen remains a flagship visual experience, while the complete product supports preparation, measurement, evidence inspection, interpretation, history and intervention workflows.
