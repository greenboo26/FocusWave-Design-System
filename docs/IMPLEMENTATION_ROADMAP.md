# FocusWave Implementation Roadmap

## Goal

Build a usable daily focus companion that runs ordinary study/work sessions on top of a mature released attention model. Research/model development and product implementation advance as two coordinated tracks connected by the `ModelBundle` release contract.

## Track A — Product implementation

### Stage A0 — Product architecture baseline

Deliverables:
- daily-use screen map
- signal/data contracts
- ModelBundle contract
- AI/content boundary
- visual design system

Exit condition: every daily product screen consumes explicit structured runtime data.

### Stage A1 — Functional web application shell

Suggested stack:
- frontend: React + TypeScript + Vite
- visualization: Canvas/WebGL/SVG
- backend/runtime API: Python + FastAPI
- live transport: WebSocket
- metadata persistence: SQLite/PostgreSQL according to deployment scale

Screens:
- Today / Home
- Start Focus
- Device Ready
- Live Focus
- Session Summary
- History / Insights
- Attention Portraits
- Settings / Trust

Exit condition: navigation, session lifecycle and structured-state simulation run as a real browser application.

### Stage A2 — Product inference interface

Deliverables:
- ModelBundle loader
- model compatibility checks
- preprocessing runtime interface
- FeatureWindow contract
- AttentionState contract
- confidence / quality policy
- simulated ModelBundle for frontend development

Exit condition: the application consumes state through the same interface later used by the mature model.

### Stage A3 — Live RS6240 runtime

Deliverables:
- SDK collector
- device connection state
- target presence / distance support
- ring buffer
- timestamps
- raw persistence policy
- signal-quality stream
- device-ready screen

Exit condition: an ordinary seated work/study session streams live sensor data into the runtime.

### Stage A4 — Mature ModelBundle integration

Input: a research-approved released ModelBundle.

Deliverables:
- exact released preprocessing implementation
- frozen feature schema
- trained model artifact loading
- inference service
- calibrated confidence
- state update stream
- model/version provenance

Exit condition: Live Focus is driven by the approved model during ordinary focus sessions.

### Stage A5 — Artistic real-time experience

Deliverables:
- mmWave/state-driven line-field renderer
- stable / drift / refocus / fatigue transitions based on the validated output schema
- imagery-theme system
- dynamic palettes
- typography system
- session time and lightweight metrics

Exit condition: the flagship page is interactive, live and scientifically downstream from the inference state.

### Stage A6 — Session summary & history

Deliverables:
- session aggregator
- focused/stable duration metrics supported by the released model
- fluctuation/recovery timeline
- personal baseline
- daily/weekly/monthly history
- session comparison
- Attention Portrait generation

Exit condition: repeated ordinary sessions form a usable longitudinal product.

### Stage A7 — AI & cultural content

Deliverables:
- verified quote database
- imagery metadata database
- AI provider adapter
- multilingual rendering
- FocusWave original-line generation
- session explanation generation
- provenance log

Exit condition: language and imagery are generated from structured mature-model outputs.

### Stage A8 — Regulation & focus practice

Deliverables:
- regulation trigger policy based on confidence and sustained state
- user-controlled visual/color regulation
- short recovery flows
- focus-practice sessions
- pre/post state comparison
- intervention outcome logging

Exit condition: the product supports monitor → feedback → optional regulation in daily use.

### Stage A9 — Packaging & competition demo

Deliverables:
- one-command startup
- device mode
- safe demo state-stream mode
- released-model manifest
- exportable session report
- privacy/storage settings
- recovery/error states
- competition presentation flow

Exit condition: a fresh machine can demonstrate a complete everyday FocusWave session.

## Track B — Research and model release

This track uses the experimental program and collected datasets.

### Stage B1 — Signal validity

Confirm usable mmWave targets, signal quality, physiological/micro-motion extraction and aligned research data.

### Stage B2 — Attention feature discovery

Use SART behavior, probes and auxiliary modalities to identify features associated with attention dynamics.

### Stage B3 — Candidate model training

Train and compare baseline, ensemble and temporal approaches using subject-aware validation.

### Stage B4 — Calibration & held-out validation

Establish probability/state calibration, quality gating, confidence behavior and cross-subject performance.

### Stage B5 — Ecological transfer validation

Test whether the model trained in standardized tasks transfers to ordinary seated study/work. Collect naturalistic or semi-naturalistic labels and quantify domain shift.

### Stage B6 — Model release

Package the approved algorithm as a versioned ModelBundle containing preprocessing, features, weights, calibration, quality policy, supported context and validation metadata.

Product Track A4 integrates this released artifact.

## Parallel development strategy

The web product can be built before the final model is ready because the inference boundary is fixed early. Frontend and interaction work use a schema-compatible simulated state stream. Real RS6240 integration can run in parallel. When research releases a mature model, the runtime swaps the simulator for the ModelBundle without redesigning the product.

## Immediate priority

1. Freeze the corrected daily-product information architecture.
2. Build the real web shell with Today, Start Focus, Device Ready, Live Focus, Summary and History.
3. Define `ModelBundle`, `AttentionState` and `SessionSummary` as versioned schemas.
4. Create a schema-compatible state simulator to develop interactions and visualization.
5. Prepare the RS6240 acquisition adapter.
6. Integrate the mature model once the research track reaches the release gate.