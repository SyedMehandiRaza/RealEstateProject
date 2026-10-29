import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthSplitLayout from '../AuthSplitLayout.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';

describe('AuthSplitLayout', () => {
  it('renders the brand, heading, subtitle, tagline and content', async () => {
    renderWithProviders([
      {
        path: '/',
        element: (
          <AuthSplitLayout
            title="Welcome Back!"
            subtitle="Access your account."
            tagline="Discover properties."
          >
            <p>form here</p>
          </AuthSplitLayout>
        ),
      },
    ]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome Back!' })).toBeInTheDocument();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
    expect(screen.getByText('Access your account.')).toBeInTheDocument();
    expect(screen.getByText('Discover properties.')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('form here');
  });

  it('"Back to home" links to / by default', async () => {
    renderWithProviders(
      [
        { path: '/', element: <h1>Home</h1> },
        { path: '/login', element: <AuthSplitLayout title="Welcome Back!" /> },
      ],
      { initialEntries: ['/login'] },
    );
    await userEvent.click(await screen.findByRole('link', { name: 'Back to home' }));
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('without backTo renders a "Go back" button that goes back in history', async () => {
    renderWithProviders(
      [
        { path: '/sign-up', element: <h1>Sign up</h1> },
        {
          path: '/verify-email',
          element: <AuthSplitLayout title="Verify Your Account" backLabel="Go back" backTo={null} />,
        },
      ],
      { initialEntries: ['/sign-up', '/verify-email'] },
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Go back' }));
    expect(await screen.findByRole('heading', { name: 'Sign up' })).toBeInTheDocument();
  });
});
