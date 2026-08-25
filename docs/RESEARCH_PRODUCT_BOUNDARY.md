# Research → Product Boundary

## Core distinction

FocusWave uses two connected workflows.

### Research workflow

Purpose: establish what the system can validly measure.

Inputs can include:
- standardized SART
- mind probes
- RS6240 mmWave
- RGB / NIR validation modalities
- behavioral outcomes
- labeled experimental conditions

Outputs:
- validated signal-processing specification
- feature schema
- trained attention model
- confidence calibration
- quality gating policy
- ecological transfer evidence
- optional normative/reference model

### Daily product workflow

Purpose: help a person during ordinary study and work.

Inputs:
- live RS6240 stream
- session context supplied by the user
- released ModelBundle

Outputs:
- continuous AttentionState
- artistic live visualization
- focus trend
- optional regulation
- session summary
- history / personal baseline
- AI/cultural interpretation

## Release boundary

The formal handoff artifact is `ModelBundle`.

```text
research evidence
   ↓
training / validation
   ↓
release gate
   ↓
ModelBundle vX.Y
   ↓
daily FocusWave runtime
```

The daily web application treats the ModelBundle as a scientific dependency. It loads and executes the released preprocessing, feature and inference definitions and records their versions with each session.

## Ecological transfer requirement

The standardized task provides controlled labels and validation conditions. Daily study/work introduces a different data distribution and a wider range of natural behaviors. A model enters the daily product scope after its validation package demonstrates acceptable transfer to the intended everyday context.

Possible validation sequence:

1. controlled SART model development
2. semi-naturalistic desk study/work sessions with intermittent probes or post-session labels
3. cross-task validation
4. held-out participant validation
5. repeated-session stability testing
6. release scope definition

## Naming rule

Use these terms consistently:

- **model training** = machine-learning research workflow
- **model release** = frozen validated algorithm package
- **focus practice / attention training** = user-facing training experience
- **live inference** = mature model execution during ordinary study/work

This vocabulary keeps the research and product meanings unambiguous.