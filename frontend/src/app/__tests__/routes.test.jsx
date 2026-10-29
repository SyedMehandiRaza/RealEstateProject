import { screen } from '@testing-library/react';
import { routes } from '../routes.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';

describe('app routes', () => {
  it('renders the home page', async () => {
    renderWithProviders(routes);
    expect(await screen.findByRole('heading', { name: 'Real Estate' })).toBeInTheDocument();
  });

  it('renders the not-found page for unknown paths', async () => {
    renderWithProviders(routes, { initialEntries: ['/nope'] });
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
