---
name: figma-to-module
description: Build React pages for a module that match the Figma design exactly, using the Figma MCP. Reads the module's page list from docs/modules/<module>/figma.md and implements one page at a time with design tokens, downloaded assets, shared Zod forms and a screenshot check. Use when the user says "build this page from Figma", "copy the UI", "implement the <module> screens", or shares a figma.com link for a module.
argument-hint: "<module-name> [page-name | figma-url]"
---

# Figma to module (exact UI)

Rules: `.claude/rules/frontend.md`. This skill wraps the Figma plugin's workflow. You **must** load the `figma-design-to-code` skill before calling `get_design_context`, and follow it.

## 0. Page registry
Each module keeps its Figma pages in `docs/modules/<module>/figma.md`:

| Page | Figma URL (with node-id) | Route | Status | Notes |
|------|--------------------------|-------|--------|-------|

- If the user passes a URL that is not listed, add a row first.
- Parse URLs per the Figma MCP rules: `figma.com/design/:fileKey/...?node-id=1-2` gives nodeId `1:2`; on a branch URL, use the branchKey.
- Work on **one page per run** unless the user asks for more. Pages with no dependency on each other can be split across agents (the `ui-implementer` agent), but only after the shared tokens and `components/ui` pass (step 2) has been done.

## 1. Read the design
1. `create_session` with the fileKey and a short task description; reuse the sessionId.
2. `get_metadata` on the page node to see the frame tree and size.
3. `get_design_context` (with a screenshot, `skillNames` including `figma-design-to-code`). If the response is sparse, fetch the visible child nodes in one parallel batch.
4. `get_variable_defs` for colors, typography, spacing and radius variables.
5. `get_code_connect_map`. If a Figma component maps to an existing code component, reuse it.

## 2. Tokens and shared components (first page of the project or a new design library)
- Sync Figma variables into `frontend/src/styles/tokens.css` as CSS custom properties, named after the Figma variable path (`--color-primary-500`, `--space-4`, `--radius-md`, `--font-heading-lg-*`). Never hardcode a value that has a token.
- Build or reuse `components/ui/*` for Figma components that appear on more than one page (Button, Input, Select, Card, Badge, Modal, Pagination...). Match every variant and state in Figma (hover, focus, disabled, error).
- Optionally register mappings with `add_code_connect_map` so future pages reuse them automatically.

## 3. Implement the page
- Location: `frontend/src/modules/<module>/pages/<PageName>/`.
- Translate absolute positioning into flex/grid layout that reproduces the same geometry at the frame width. Keep exact spacing, sizes, font weights, line heights, colors, radii and shadows.
- Assets: use the assets returned by the MCP and saved locally under `frontend/src/assets/<module>/`. No temporary Figma URLs remain in code. Do not redraw or substitute icons.
- Dynamic content (listings, prices, user data) comes from props, API or mocks, never baked into the markup. Text from the design becomes placeholder or mock data where it is data.
- Forms: fields come from the shared Zod schema (`/shared-validation`); `react-hook-form` + `zodResolver`; error text placement and styling follow the Figma error state.
- Responsiveness (required for every page, even when Figma has only a desktop frame):
  - At the frame's own width the page matches Figma exactly. Where Figma has a tablet or mobile frame, that frame is the target at its width.
  - Every page also works at 1280x720, 1366x768, 1024x768, 768x1024 and 375x812: nothing overlaps or is cut off, no horizontal scroll, and no vertical scroll when the content would fit in the window.
  - Never copy Figma's absolute positions as fixed pixels for the page layout. Use flex/grid, `max-width`, `min()`/`clamp()` and percentages, so the layout shrinks and grows with the window.
  - Where Figma has no frame for a size, follow the module's documented responsive rule in `docs/modules/<module>/figma.md` (for example: below 1024 px the decorative hero is hidden and the form card fills the width). If the module has no rule yet, propose one, ask the user once, and record the answer there.
- Text: copy every string, font size, weight, line height, letter spacing and color from `get_design_context`, not from the screenshot.
- Accessibility: semantic elements, labels, alt text, focus states.

## 4. Verify (required)
1. Run the frontend dev server, open the route with the Playwright MCP at the Figma frame's size, and take a screenshot.
2. Compare it with the Figma screenshot: layout, spacing, typography, colors, assets, and states. Check the text with the browser's computed styles (font size, weight, line height, color) against the Figma values, not only by eye. Fix every in-scope mismatch and repeat. Note out-of-scope differences instead of changing them.
3. Resize to each size in the responsiveness list, take a screenshot at each and fix any overlap, clipping or unneeded scroll.
4. Add Playwright visual tests (`toHaveScreenshot`) for the page in `e2e/` once it matches: at the Figma frame size and at 1366x768 and 375x812. Use `/playwright-e2e`.
5. Add an RTL test for page behavior (render, form errors, interactions).

## 5. Close out
- Update the `Status` column in `figma.md` (`todo`, `in-progress`, `matches-figma`, `needs-design-answer`).
- Report: files changed, components reused or added, tokens added, open design questions (missing states, missing mobile frame, unclear interactions).
