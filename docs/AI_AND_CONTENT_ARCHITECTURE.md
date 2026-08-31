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

## Prototype interaction contract

The interactive prototype exposes AI as an optional reflection capability rather than as a persistent chat surface in Focus Mode.

The user-visible states are:

```text
idle → loading → success
          └──→ error → retry
```

Each result shows its input type, excluded data, provider/runtime status and template version. The default cloud-eligible input is a structured `SessionSummary`; raw mmWave, direct identifiers and scientific inference are excluded from the AI path. When no provider is connected, curated content and a clearly labelled local preview remain available.

The UI calls one replaceable adapter contract. A future local model, cloud provider or competition runtime may replace the implementation without changing the measurement pipeline or the session-summary interface.

Content generation may run as an offline batch outside a focus session. The content library presents these items under the neutral user-facing category `新创短句`; it does not add a distracting AI badge to every line. The stored item still retains generation method, template version, timestamp and review status so the production library can audit, filter or withdraw a batch later. Generated drafts never become measurement evidence and do not bypass content review.

The current prototype ships a reviewed offline content pack rather than pretending that GitHub Pages has a live model connection: 64 human-authored original lines and 128 AI-assisted batch lines cover the same 4 themes × 4 attention states. Literature categories contain 16 verified world-literature entries and 16 Chinese-classical entries. The browser-side “扩写一组草稿” action remains a local draft preview until an authorized provider replaces the adapter; it is not reported as a connected external model.
