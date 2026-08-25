# FocusWave Product Runtime Architecture

## Goal

Define the everyday runtime that connects RS6240 to a released `ModelBundle` and then to the browser experience. The product runtime executes approved inference; model training remains in the research pipeline.

## Recommended deployment shape

For the competition prototype, the most practical architecture is **local sensing + local inference + browser UI**, with optional cloud AI/content services.

```text
RS6240 hardware
   ↓ USB / vendor transport
FocusWave Sensor Service
   ↓ canonical frames
Signal Runtime
   ↓ released preprocessing
Feature Window Runtime
   ↓ model-ready feature tensor
ModelBundle Runtime
   ↓ calibrated AttentionState
Local Realtime API
   ↓ WebSocket
Browser FocusWave UI
   ├── Live Focus
   ├── Detail
   ├── Summary
   └── History

Optional network path:
Structured state/context → AI Content Adapter → text/quote result
```

This shape keeps the sensing and attention-estimation loop close to the user, supports low latency and aligns with the privacy value of mmWave sensing.

## 1. Sensor Service

A small native/local service owns the RS6240 SDK connection.

Responsibilities:

- discover/connect device
- load supported radar profile
- receive frames continuously
- attach sensor and host timestamps
- monitor frame continuity
- expose target-presence / basic connection health
- write raw data according to retention policy
- publish frames to the Signal Runtime

Suggested implementation: Python if SDK support and throughput are sufficient; C++ adapter can be introduced if the vendor runtime requires it.

## 2. Signal Runtime

Executes the exact preprocessing specification associated with the active ModelBundle.

Possible stages, depending on the released model:

- channel/frame parsing
- target/range support
- phase extraction / unwrapping
- artifact handling
- respiration representation
- cardiac micro-motion representation
- movement / residual motion
- quality / coverage features
- feature-window construction

The runtime version is part of model provenance.

## 3. ModelBundle Runtime

### Bundle layout

```text
model-bundle/
├── manifest.json
├── preprocessing.json
├── feature_schema.json
├── scaler.*
├── model.*
├── calibration.*
├── quality_policy.json
├── state_schema.json
├── validation_summary.json
└── compatibility.json
```

### `manifest.json`

```json
{
  "bundle_id": "focuswave-attention-v1.0.0",
  "model_version": "1.0.0",
  "runtime_api": "1.0",
  "device_profile": "RS6240-profile-A",
  "window_seconds": 20,
  "update_seconds": 2,
  "norm_version": null,
  "intended_use": ["seated-study", "seated-work"]
}
```

### Inference output

```json
{
  "type": "attention_state",
  "session_id": "2026-08-25T190000-writing",
  "window_start": 102.0,
  "window_end": 122.0,
  "state": {
    "maintenance": 0.78,
    "stability": 0.74,
    "fluctuation": 0.22,
    "arousal": 0.61
  },
  "region": "stable_engagement",
  "focus_index": 78,
  "confidence": 0.82,
  "quality": 0.91,
  "model_version": "1.0.0",
  "visual_mapping_version": "1.0"
}
```

The exact state dimensions remain determined by the validated model release.

## 4. Local Realtime API

A FastAPI-style local service can provide:

```text
GET  /api/device
POST /api/session
POST /api/session/{id}/finish
GET  /api/session/{id}
GET  /api/history
GET  /api/model
WS   /ws/live/{session_id}
```

WebSocket messages:

- `device_state`
- `attention_state`
- `signal_summary`
- `regulation_event`
- `session_clock`

The browser consumes these structured messages and owns presentation only.

## 5. Session storage

Prototype storage can combine SQLite metadata with file-based numeric arrays.

```text
data/
├── focuswave.db
└── sessions/
    └── <session-id>/
        ├── session.json
        ├── raw/
        ├── states.ndjson
        ├── events.ndjson
        ├── summary.json
        └── portrait.json
```

Suggested database entities:

- user/profile
- device profile
- session
- session tag
- model bundle
- regulation episode
- generated content record

## 6. Browser architecture

Recommended product stack:

- React + TypeScript
- Canvas or WebGL for the live line field
- lightweight state store for session/device/UI state
- WebSocket client for live runtime
- SVG/Canvas for 2D portraits
- WebGL/Three.js-style renderer later for 3D Attention Portraits

Screen state comes from a shared runtime store:

```text
DeviceState
SessionState
AttentionState
SignalSummary
RegulationState
ContentState
```

## 7. Development simulator

Frontend development uses a schema-compatible simulator before the mature model is released.

The simulator publishes the same `attention_state` messages as the future ModelBundle runtime and supports scripted transitions:

```text
stable → mild drift → fluctuation → refocusing → stable
```

This simulator is a development source only. Replacing it with mature inference leaves the browser contract unchanged.

## 8. AI / content integration

The AI path receives structured, already-inferred state and session context.

```json
{
  "region": "refocusing",
  "confidence": 0.84,
  "theme": "ocean",
  "text_mode": "global-literature",
  "session_minutes": 38,
  "recent_transition": "drift_to_refocus"
}
```

The content adapter returns one of:

- approved database line
- verified literary excerpt + translation + source
- FocusWave original short line
- session-summary explanation

The app can operate with a local curated content database when an AI provider is unavailable.

## 9. Regulation policy runtime

A policy layer consumes a short history of `AttentionState`, user preferences and session timing.

Example event:

```json
{
  "eligible": true,
  "reason": "sustained_drift_high_confidence",
  "suggestion": "visual_reset_30s",
  "cooldown_seconds": 900
}
```

The product records the user's choice and post-regulation state trajectory.

## 10. Engineering milestones

### Runtime P0

Browser shell + simulated `AttentionState` + multi-screen navigation.

### Runtime P1

Local FastAPI/WebSocket service + simulator served through the real transport contract.

### Runtime P2

RS6240 Sensor Service + live signal-quality stream.

### Runtime P3

Released preprocessing runtime + FeatureWindow.

### Runtime P4

Mature ModelBundle integration.

### Runtime P5

AI content adapter + curated database.

### Runtime P6

Session summary, history, regulation and Attention Portrait persistence.
