# Frontend Rules (React)

## Layout
```
frontend/src/
  app/                    # store.js (makeStore), routes.jsx, router.jsx
  config/env.js           # the only place that reads import.meta.env
  services/api/baseApi.js # RTK Query API with Bearer header + refresh-on-401 (one shared refresh)
  modules/<module>/
    pages/<PageName>/     # one folder per Figma page/frame: PageName.jsx, styles, __tests__
    components/           # module-specific components
    api/<module>Api.js    # baseApi.injectEndpoints({...})
    store/<module>Slice.js  # client state only (server data lives in RTK Query)
    hooks/
  components/ui/          # shared design-system components (Button, Input, ...)
  components/routing/     # ProtectedRoute (roles)
  pages/                  # app-level pages (Home, NotFound)
  styles/tokens.css       # design tokens generated from Figma variables
  assets/<module>/        # assets downloaded from Figma
  lib/applyServerErrors.js  # maps API error.fields onto react-hook-form
  test/                   # MSW server, renderWithProviders
```

## State and data
- Server data: RTK Query endpoints injected into `baseApi`; no manual fetch/axios calls.
- Auth: the access token and user live only in Redux memory (`auth` slice); the refresh token is an httpOnly cookie. Never store tokens in localStorage.
- `ProtectedRoute` is UX only; the API enforces authorization.

## Figma fidelity
- The Figma frame is the source of truth for layout, spacing, typography, colors, radii, shadows and assets. Use `/figma-to-module`.
- Use tokens from `styles/tokens.css` (from Figma variables); no hardcoded hex or pixel values where a token exists.
- Reuse `components/ui/` before creating new components. A Figma component used on more than one page belongs in `components/ui/`.
- Every page must be checked against the Figma screenshot at the frame's width (plus mobile if the design has a mobile frame).

## Forms
- `react-hook-form` + `zodResolver(schema)`, with the schema imported from `@real-estate/shared`. On a failed mutation call `applyServerErrors(error, setError)` and show the returned form-level message.
- Show the error message exactly as produced by the schema or returned in `error.fields` by the API. Do not rephrase.
- Disable submit while submitting; show API errors that are not field errors in a form-level alert.

## Accessibility and quality
- Inputs have associated labels; errors are linked with `aria-describedby`; interactive elements are keyboard-reachable.
- Prefer `getByRole`/`getByLabelText` in tests, so tests also guard accessibility.
