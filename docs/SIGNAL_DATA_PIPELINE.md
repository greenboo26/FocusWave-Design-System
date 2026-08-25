# FocusWave Signal & Data Pipeline

## Goal

Build one reproducible data path that supports both live measurement and offline replay.

## Live chain

```text
RS6240
  ↓ SDK/API
Frame Collector
  ↓ canonical RawFrame
Timestamp & Sync Service ← SART / key response / probe / block events
  ↓ unified session time
Ring Buffer + Raw Store
  ↓
Target Lock / Range Gate
  ↓
Phase Extraction & Unwrap
  ↓
Artifact / Motion Handling
  ↓
Physiology Separation
  ├── respiration waveform → RR / amplitude / irregularity
  ├── cardiac micro-motion → beat / IBI / HR / HRV
  └── residual displacement → movement / micro-motion
  ↓
Quality Engine
  ↓
Window Builder
  ├── continuous windows
  ├── trial-aligned windows
  ├── probe-aligned windows
  ├── error-preceding windows
  ├── block windows
  └── baseline/rest windows
  ↓
Feature Store
  ↓
State Model + Norm Engine
  ↓
Realtime Event Bus / WebSocket
  ↓
UI / Report / History / AI interpretation
```

## Offline chain

```text
NPZ / archived raw session
  ↓ Import Adapter
canonical RawFrame + Event records
  ↓
SAME Timestamp / Processing / Feature / Model pipeline
```

Live and offline modes therefore produce the same schemas and can be compared directly.

## Canonical event schemas

### RawFrame

```json
{
  "session_id": "...",
  "frame_index": 120034,
  "sensor_time_ns": 0,
  "host_time_ns": 0,
  "sync_epoch": 3,
  "sample_rate_hz": 100,
  "channels": 8,
  "payload_ref": "raw/...",
  "source": "rs6240"
}
```

### TaskEvent

```json
{
  "session_id": "...",
  "event_time_ns": 0,
  "trial_index": 388,
  "block": 2,
  "condition": "standard",
  "event_type": "stimulus_onset | response | probe | rest_start | ttl",
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
  "alignment": "continuous | trial | probe | error_pre | baseline | block",
  "source_event_id": "...",
  "quality": 0.91,
  "features": {
    "hr": 72.4,
    "rr": 14.2,
    "ibi_mean_ms": 829,
    "movement_index": 0.12
  },
  "processing_version": "..."
}
```

### AttentionState

```json
{
  "session_id": "...",
  "window_id": "...",
  "state_vector": {
    "maintenance": 0.78,
    "response_stability": 0.71,
    "fluctuation": 0.24
  },
  "state_label": "stable",
  "confidence": 0.82,
  "model_version": "...",
  "norm_version": "..."
}
```

## Transport design

### Measurement path

- acquisition service publishes raw frame metadata and synchronization records
- processing service consumes frames through a bounded ring buffer
- feature/state updates are published as compact structured messages
- browser UI receives live state through WebSocket
- persistence runs continuously alongside streaming

### AI path

AI receives a compact `InterpretationContext` after the scientific state has been computed. It does not participate in frame acquisition, signal processing or numerical state estimation.

```json
{
  "attention_state": "refocusing",
  "state_vector": {...},
  "confidence": 0.79,
  "quality": "good",
  "imagery_theme": "ocean",
  "language": "zh-CN",
  "mode": "original_shortline"
}
```

## Latency budget for a usable live prototype

Target engineering budget:

- acquisition + timestamp: < 50 ms
- signal window update: 0.5–2 s depending on feature
- lightweight state inference: < 100 ms after feature availability
- UI transport/render: < 100 ms
- visual animation smoothing: continuous

Physiological metrics that inherently require longer windows update at their scientifically appropriate cadence while the visual layer interpolates continuously between validated state updates.

## Provenance

Every displayed state can be traced through:

`UI state → AttentionState → FeatureWindow → processing version → raw frame interval + task events`.

This provenance is the basis for debugging, report audit, model comparison and later research validation.
