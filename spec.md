# Specification

## Summary
**Goal:** Add per-emotion-mode guidance text and tonal UI styling to the PostCreationPage, plus a conditional safety footer for BROKE+PUBLIC posts.

**Planned changes:**
- When HAPPY mode is selected, display guidance text: "Share something real, not something impressive." Style the form area with warm amber/golden color accents, gentle typography, and calm spacing.
- When CONFESS mode is selected, display guidance text: "This space is for release, not applause." Style the form area with soft, muted neutral tones and quiet typography — no bright accents.
- When BROKE mode is selected, display guidance text: "Share what feels true right now. You don't have to explain everything." Style the form area with subdued, low-contrast colors conveying safety and calm.
- When emotion mode is BROKE and visibility is PUBLIC, display a subtle footer beneath the form with the exact text: "Veil is a reflection space. If you are in immediate danger, please contact local emergency services." — small font, muted/low-opacity, non-alarming. Footer does not appear for BROKE+PRIVATE or any other emotion mode.

**User-visible outcome:** On the PostCreationPage, selecting an emotion mode now shows contextual guidance text and shifts the visual tone of the form to match that mode. Users posting publicly in BROKE mode also see a subtle safety reminder at the bottom of the form.
