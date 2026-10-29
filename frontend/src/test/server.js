import { setupServer } from 'msw/node';

// MSW server for component tests. Add handlers per test with server.use(...).
export const server = setupServer();

export const apiUrl = (path) => `${process.env.VITE_API_URL}${path}`;
