# FocusWave Visual Lab

This folder is an isolated proof-of-concept area. It does not replace the current production visual engine or long-term garden behavior.

## PoC 01 — `simplex-motion.html`

Dependency: `simplex-noise@4.0.3` (MIT).

Goals:
- Generate mountain geometry once from seeded 2D simplex noise.
- Never mutate mountain x/y coordinates during animation.
- Animate only fog masks horizontally.
- Generate incense smoke using continuous 3D simplex noise rather than periodic sine motion.

Acceptance criteria:
- Mountain ridges visibly remain fixed while fog crosses them.
- Upper/middle/lower fog bands are all present.
- Mountain layers have non-repeating multi-peak profiles.
- Smoke looks continuous and organic without a repeating left/right oscillation.

## PoC 02 — `rake-tools.html`

Dependency: `perfect-freehand@1.2.3` (MIT).

Goals:
- Start from clean unraked white sand.
- User strokes are the only source of rake grooves.
- Smooth the center gesture with `perfect-freehand` stroke points.
- Generate fine/medium/coarse rake teeth as normal-offset parallel paths.
- Support flatten, undo, and reset.

Acceptance criteria:
- Initial sand contains no generated rake lines.
- Moving or editing unrelated objects cannot create grooves automatically.
- Different rake tools visibly change tooth count and spacing.
- New strokes can overlap existing strokes naturally.
- Flatten actions remove local grooves and remain undoable.

## Integration rule

Do not migrate either PoC into the production prototype until the visual behavior is explicitly approved. Keep production changes scoped to the approved mechanism only.