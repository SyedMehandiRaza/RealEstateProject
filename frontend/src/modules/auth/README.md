# auth module (frontend)

- `store/authSlice.js`: access token + current user (memory only)
- `pages/`: one folder per Figma frame (built with `/figma-to-module auth <page>`)
- `components/`, `hooks/`: module-specific pieces
- `api/authApi.js`: `baseApi.injectEndpoints(...)` for login, sign-up, refresh, logout (added once the auth API contract is agreed)
