# FocusWave Signal & Data Pipeline

## Runtime goal

The daily FocusWave product runs a deterministic inference pipeline built from a released `ModelBundle`. The browser receives state outputs from ordinary study/work sessions while the scientific preprocessing and model execution remain reproducible and versioned.

## Daily product chain

```text
RS6240
  ↓ SDK/API
Frame Collector
  ↓ canonical RawFrame
Session Clock
  ↓
Ring Buffer + Raw Store
  ↓
Released Preprocessing Runtime
  ├── target / range support
  ├── phase extraction / unwrap
  ├── artifact & movement handling
  ├── respiration representation
  ├── cardiac micro-motion representation
  └── quality / coverage
  ↓
Released Feature Builder
  ↓ model-ready FeatureWindow
Mature Model Inference
  ↓
Confidence Calibration + Quality Policy
  ↓
AttentionState Stream
  ↓ WebSocket / local event bus
Experience Layer
  ├── live artistic line field
  ├── state text / AI content
  ├── regulation
  ├── session summary
  └── history / portrait
```

## ModelBundle contract

```json
{
  "model_version": "attention-1.0.0",
  "preprocessing_version": "signal-2.1.0",
  "feature_schema_version": "focus-features-1",
  "device_profile": "RS6240-100Hz-2T4R",
  "window_spec": {
    "length_s": 20,
    "step_s": 2
  },
  "normalization_ref": "scaler-1.0",
  "confidence_calibration": "cal-1.0",
  "quality_policy": "quality-1.0",
  "intended_use": "ordinary seated study/work focus sessions",
  "validation_ref": "validation-report-..."
}
```

The product loads one compatible bundle and records its version with every session.

## Canonical product schemas

### RawFrame

```json
{
  "session_id": "...",
  "frame_index": 120034,
  "sensor_time_ns": 0,
  "host_time_ns": 0,
  "sample_rate_hz": 100,
  "channels": 8,
  "payload_ref": "raw/...",
  "source": "rs6240"
}
```

### SessionEvent

```json
{
  "session_id": "...",
  "event_time_ns": 0,
  "event_type": "session_start | pause | resume | break | regulation_start | regulation_end | session_end",
  "value": "..."
}
```

### FeatureWindow

```json
{
  "session_id": "...",
  "window_id": "...",
  "start_time_ns": 0,
  "end_time_ns": 0,
  "quality": 0.91,
  "features": {
    "feature_001": 0.42,
    "feature_002": 0.18
  },
  "processing_version": "signal-2.1.0",
  "feature_schema_version": "focus-features-1"
}
```

### AttentionState

```json
{
  "session_id": "...",
  "window_id": "...",
  "state_vector": {
    "maintenance": 0.78,
    "stability": 0.73,
    "drift": 0.19,
    "arousal": 0.61
  },
  "state_region": "stable_focus",
  "confidence": 0.82,
  "quality": 0.91,
  "model_version": "attention-1.0.0",
  "source_window": "..."
}
```

The exact state dimensions remain tied to the final validated model. The product schema supports continuous values so the interface can show gradual transitions.

## Session summary pipeline

```text
AttentionState stream + SessionEvents
              ↓
       Session Aggregator
              ↓
      SessionSummary JSON
              ├── focused duration
              ├── stability / fluctuation trajectory
              ├── recovery episodes
              ├── quality coverage
              ├── personal-baseline comparison
              └── portrait-generation parameters
```

## Research training chain

The research pipeline is a separate upstream system:

```text
SART + mind probes + mmWave + RGB/NIR + labels
                    ↓
           aligned research dataset
                    ↓
    feature research / model training
                    ↓
         validation / calibration
                    ↓
            release decision
                    ↓
             ModelBundle
                    ↓
             daily product
```

Research can replay archived NPZ files and experiment with candidate preprocessing/model versions. Product runtime receives only a released bundle whose preprocessing, feature schema and model artifact are mutually compatible.

## Transport design

- acquisition service collects live RS6240 frames
- inference runtime processes bounded windows locally or on an approved server deployment
- compact `AttentionState` messages are delivered to the browser through WebSocket
- session summaries are persisted for history and portraits
- raw-data retention follows explicit privacy/storage settings

## AI path

AI consumes `AttentionState` or `SessionSummary` after mature model inference.

```text
AttentionState / SessionSummary
        ↓
InterpretationContext
        ↓
AI / verified content engine
        ↓
human-facing text and imagery selection
```

## Provenance

Every displayed state records:

`UI state → AttentionState → ModelBundle → FeatureWindow → preprocessing version → raw frame interval`.

This provenance supports debugging, algorithm auditing, model upgrades and reproducible session interpretation.