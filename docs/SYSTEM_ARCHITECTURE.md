# FocusWave System Architecture

## Product definition

FocusWave is a complete attention-state assessment platform. The product connects standardized SART task execution, mmWave acquisition, synchronized signal processing, state inference, normative interpretation, report generation, longitudinal tracking, and optional training/regulation into one usable system.

The current artistic real-time screen is one presentation surface inside this architecture.

## End-to-end architecture

```text
SART task / session control
        │
        ├── task events / probe events / response events
        │
RS6240 mmWave ──> Acquisition Gateway ──> Sync Layer ──> Raw Stream Store
                                        │
                                        └──> Processing Engine
                                              │
                                              ├── target locking / range gate
                                              ├── phase unwrap
                                              ├── respiration
                                              ├── heartbeat / IBI / HRV
                                              ├── movement / micro-motion
                                              └── quality / coverage
                                                     │
                                                     v
                                              Feature Window Service
                                                     │
                         ┌───────────────────────────┼───────────────────────────┐
                         v                           v                           v
                 State Inference Engine      Normative Engine          Research Export
                         │                           │
                         └─────────────┬─────────────┘
                                       v
                              Interpretation Layer
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             v                         v                         v
      Real-time Monitor          Session Report            History / Trends
             │                         │                         │
             └───────────────> Regulation / Training <──────────┘
                                       │
                                       v
                              AI Text / Quote Layer
```

## Core product layers

### 1. Session & Task Layer

Creates a session, binds participant/session metadata, launches the game-based SART, records response events, condition/block information, mind-probe responses, rest periods and task timestamps.

### 2. Acquisition Gateway

Provides one canonical input contract for both live RS6240 streaming and offline file replay. Live frames and imported NPZ sessions enter the same downstream processing pipeline.

Canonical frame fields:

- session_id
- source_device
- sensor_timestamp
- host_timestamp
- frame_index
- raw_complex_iq / frame payload
- channel metadata
- sync marker

### 3. Synchronization Layer

Builds a unified time axis for mmWave, task events, responses and probe events. Hardware TTL events and software timestamps are both represented as explicit synchronization records so that every derived window can be traced back to source time.

### 4. Signal Processing Engine

Transforms raw mmWave frames into physiological and motion signals. Processing stages are versioned and reproducible.

Primary outputs:

- chest target / range gate
- unwrapped phase
- respiration waveform and RR
- cardiac micro-motion
- beat timestamps / IBI
- HR / HRV features
- movement and micro-motion features
- coverage / confidence / quality flags

### 5. Feature Window Service

Creates analysis windows aligned to SART events, probes, blocks, rest periods and continuous time. It is the bridge between signal processing and psychological modeling.

### 6. State Inference Engine

Combines physiological, movement and behavioral features to estimate continuous attention-state dimensions and task-relevant state probabilities. Model outputs always include model version, confidence and feature-window provenance.

### 7. Normative & Standardization Engine

Converts raw features and model outputs into interpretable percentiles, standardized scores and reference bands once the relevant normative dataset is available. Norm version and subgroup definition are attached to every standardized output.

### 8. Interpretation & Report Engine

Produces three families of result:

- behavioral performance: commission error, omission error, mean RT, RT variability and related SART indicators
- state dynamics: physiological, micro-motion and attention-state trajectories across the session
- composite interpretation: attention maintenance, response stability and state fluctuation dimensions

### 9. Experience Layer

Contains multiple product screens rather than one dashboard:

- Home / session setup
- Device connection & signal calibration
- Task / live session
- Real-time attention visualization
- Scientific signal view
- Session report
- History & longitudinal trends
- Regulation / training
- Research / admin console

### 10. AI Text & Cultural Layer

Runs outside the critical measurement path. It receives structured state summaries and approved imagery/text metadata, then selects or generates human-readable feedback. It can power multilingual literary references, original short lines and report-language adaptation while preserving the scientific result supplied by the measurement engine.

## Engineering principle

The architecture uses one source of truth for each layer: one session clock, one signal-processing pipeline, one feature schema, one state-output schema and one report schema. Live UI, report UI, history UI and AI narration all consume those same structured outputs.
