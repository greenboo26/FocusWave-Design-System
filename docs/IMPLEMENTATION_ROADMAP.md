# FocusWave Implementation Roadmap

## Goal

Turn the current visual exploration into a usable assessment system through staged integration. Each stage produces an executable artifact that becomes the foundation of the next stage.

## Stage 0 — Architecture baseline

Deliverables:
- product module map
- signal/data contracts
- screen hierarchy
- AI boundary
- repository design rules

Exit condition: every planned screen and service has an explicit input/output contract.

## Stage 1 — Web application shell

Build the actual browser application around the current visual language.

Suggested stack:
- frontend: React + TypeScript + Vite
- visualization: Canvas/WebGL/SVG depending on line-field load
- backend: Python + FastAPI
- live transport: WebSocket
- local persistence: SQLite for prototype metadata + filesystem/NPZ for raw arrays

Screens delivered:
- Home / session setup
- Device calibration placeholder
- Live monitor using simulated structured state
- Session report shell
- History shell
- Research console shell

Exit condition: the system can run end-to-end with simulated data and navigation, with no static-image-only screens.

## Stage 2 — Offline real-data replay

Connect existing recorded mmWave sessions to the application through the canonical import adapter.

Deliverables:
- NPZ import
- raw-session metadata reader
- signal-processing call interface
- feature/state replay API
- timeline playback controls
- scientific evidence view
- artistic line field driven by real replayed state values

Exit condition: one archived participant session can be replayed through the same UI from beginning to end.

## Stage 3 — Live RS6240 acquisition

Deliverables:
- SDK collector service
- connection state machine
- raw-frame ring buffer
- host/sensor timestamp capture
- live raw persistence
- range-gate/target-lock status
- baseline acquisition
- live quality metrics

Exit condition: the browser can display live device status and receive continuously updated processed signals from a real RS6240 session.

## Stage 4 — Task synchronization

Deliverables:
- SART event adapter
- TTL/synchronization event ingestion
- unified session clock
- trial / probe / block markers
- aligned feature windows

Exit condition: selecting any trial in the research console retrieves its corresponding mmWave interval and derived features.

## Stage 5 — State inference

Deliverables:
- model-service interface
- logistic baseline
- tree/ensemble model interface
- temporal model interface
- state-vector schema
- confidence and model provenance
- replay comparison between model versions

Exit condition: the live/replay UI consumes model outputs instead of simulated attention scores.

## Stage 6 — Standardized interpretation

Deliverables:
- reference/norm dataset schema
- percentile/standard-score service
- norm-version metadata
- report comparison components
- within-person baseline comparison

Exit condition: the report can distinguish raw values, model states, reference comparison and longitudinal change.

## Stage 7 — AI & cultural content

Deliverables:
- verified quote database
- imagery metadata database
- AI provider adapter
- original short-line generation
- multilingual quote + translation rendering
- report explanation generation
- generation provenance log

Exit condition: AI-generated wording is produced from structured results and remains traceable to state/context and source material.

## Stage 8 — Regulation & training prototype

Deliverables:
- regulation entry from live/history screens
- color/theme transition engine
- short intervention session
- pre/post state comparison
- training-session history

Exit condition: the system completes the product loop from measurement to feedback to optional regulation and captures the outcome of that regulation.

## Stage 9 — Packaging & competition demo

Deliverables:
- one-command local startup
- demo dataset
- real-device mode
- offline replay mode
- model/version manifest
- exportable report
- recovery/error states
- competition presentation flow

Exit condition: a new machine can run the full demo with a documented setup process and a predictable presentation path.

## Immediate build priority

The next implementation milestone is Stage 1 + Stage 2 together: create the real web shell, then feed it one existing mmWave session. This converts the current design from visual concepts into an executable product while keeping hardware integration independent enough to proceed in parallel.
