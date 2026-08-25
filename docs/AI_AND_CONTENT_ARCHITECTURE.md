# FocusWave AI & Content Architecture

## Role of AI

AI is an interpretation and presentation layer built on top of validated structured measurement results.

It supports:
- natural-language explanation
- multilingual literary/cultural content retrieval
- original short-line generation
- report wording adaptation
- state-to-imagery selection
- training/regulation guidance text

## Architecture

```text
Scientific result JSON
      ↓
Interpretation Policy
      ├── state semantics
      ├── confidence / quality
      ├── normative context
      └── allowed feedback depth
      ↓
Content Router
      ├── verified quote database
      ├── imagery database
      ├── color/theme rules
      ├── original-text generator
      └── report explanation generator
      ↓
Renderer
      ├── live short line
      ├── report paragraph
      ├── multilingual quote + translation
      └── regulation prompt
```

## Verified Quote Database

Suggested fields:

```json
{
  "id": "q_001",
  "type": "classic",
  "language": "en",
  "original": "...",
  "translation_zh": "...",
  "author": "...",
  "work": "...",
  "source": "...",
  "semantic_tags": ["clarity", "return", "stillness"],
  "imagery_tags": ["ocean", "cloud"],
  "arousal": 0.35,
  "tone": "contemplative",
  "verification": "verified"
}
```

## Imagery Database

Imagery is represented as semantic and visual behavior metadata rather than as background illustrations.

Fields can include:
- theme: mountain / ocean / bamboo / rain / cloud / incense / dusk / flower / moon
- semantic axes: cohesion, drift, clarity, arousal, inwardness, continuity
- line-field behavior
- base palette
- transition behavior
- text tags
- suitable attention-state ranges

## LLM Adapter

The application should use an adapter interface rather than hard-code one provider.

```text
AIProvider
├── generate_shortline(context)
├── explain_report(context)
├── translate_quote(source, target)
└── rank_content(candidates, context)
```

This allows local models, cloud APIs or later competition deployment requirements to share the same application contract.

## Measurement / AI boundary

The measurement engine publishes structured numbers and state outputs first. AI receives those values and generates presentation language second. Each generated text stores:
- source state window
- model/provider
- prompt/template version
- content source IDs
- generation timestamp

This separation preserves reproducibility of the scientific result while allowing the human-facing layer to evolve quickly.
