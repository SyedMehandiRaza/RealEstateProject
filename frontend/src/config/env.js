// The only place that reads import.meta.env.
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
};
