# PROP-024: Build the developer app shell (sidebar and top bar)

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Pages, PROP-SPEC-001 §Responsive rule, PROP-SPEC-001 §Further Notes
- **Figma:** My Properties [13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145)

## What to build

Developer pages sit inside a shared layout with the sidebar and top bar from the Figma frames; the Properties entry is active on property pages. Built additively as new components, since other module branches may build their own (noted for the merge).

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the sidebar and top bar of the frame
- [ ] UI: 768–1279 collapses the sidebar to icons; under 768 it becomes a top bar with a menu button that opens and closes it (keyboard and Escape)
- [ ] UI: links to other modules not yet built are shown but disabled
- [ ] UI: no horizontal page scroll at 1366x768, 1280x720, 768x1024 and 375x812
- [ ] Accessibility: landmarks (`nav`, `main`), the current page marked with `aria-current`

## Out of scope

- Page content (PROP-025 onwards)
- Other modules' pages

## Verification

_Filled when done._
