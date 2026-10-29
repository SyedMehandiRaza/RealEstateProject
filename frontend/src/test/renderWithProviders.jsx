import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { makeStore } from '../app/store.js';

// Renders routes with a fresh Redux store and an in-memory router.
export function renderWithProviders(routes, { preloadedState, initialEntries = ['/'] } = {}) {
  const store = makeStore(preloadedState);
  const router = createMemoryRouter(routes, { initialEntries });
  return {
    store,
    router,
    ...render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    ),
  };
}
