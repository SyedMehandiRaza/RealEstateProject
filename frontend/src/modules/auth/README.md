# auth module (frontend)

- `store/authSlice.js`: access token + current user (memory only)
- `pages/`: one folder per Figma frame (built with `/figma-to-module auth <page>`)
- `components/`, `hooks/`: module-specific pieces
- `api/authApi.js`: `baseApi.injectEndpoints(...)`; empty since TASK-031, each page ticket adds its endpoints
- `routes.jsx`: `AUTH_PATHS` and `authRoutes` (spread into `app/routes.jsx`); routes point at `AuthPlaceholderPage` until their page ticket replaces them
- Shared UI used by the pages: `components/ui/` AuthSplitLayout, TextInput, Button, Tabs, OtpInput (TASK-031)
