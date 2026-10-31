import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { apiUrl, server } from '../../../test/server.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import DeveloperLayout from '../DeveloperLayout.jsx';

// STAFF-011: the shared developer layout (STAFF-DEC-008, STAFF-DEC-018).
const developer = { id: 1, fullName: 'Shivam Gawali', email: 'dev@example.com', roles: ['developer'] };
const loggedIn = { auth: { accessToken: 'token', user: developer, restoringSession: false } };

function renderLayout(path = '/staff', user = developer) {
  const page = (
    <DeveloperLayout title="Staff Management">
      <p>Page content</p>
    </DeveloperLayout>
  );
  return renderWithProviders(
    [
      { path: '/staff', element: page },
      { path: '/staff/:id', element: page },
      { path: '/login', element: <p>Log in page</p> },
    ],
    { preloadedState: { auth: { ...loggedIn.auth, user } }, initialEntries: [path] },
  );
}

const NAV = [
  ['Dashboard', '/dashboard'],
  ['My Properties', '/properties'],
  ['CRM', '/crm'],
  ['Marketing', '/marketing'],
  ['Staff Management', '/staff'],
  ['Facility Management', '/facility'],
  ['Subscription', '/subscription'],
  ['Support', '/support'],
  ['Account', '/account'],
];

describe('DeveloperLayout', () => {
  it('shows the logo text, the nine menu links in order, Log out, the title and the content', () => {
    renderLayout();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual(NAV);
    expect(within(nav).getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Staff Management' })).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it.each(['/staff', '/staff/12'])('marks Staff Management as the current page on %s', (path) => {
    renderLayout(path);
    expect(screen.getByRole('link', { name: 'Staff Management' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['Shivam Gawali', 'SG'],
    ['Rajesh Kumar Mehta', 'RM'],
    ['Rajesh', 'R'],
  ])('shows the initials of %s as the avatar', (fullName, initials) => {
    renderLayout('/staff', { ...developer, fullName });
    expect(screen.getByRole('img', { name: fullName })).toHaveTextContent(initials);
  });

  it('has a notifications button', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('opens the menu from the menu button and closes it with Escape, returning focus', async () => {
    const user = userEvent.setup();
    renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
  });

  it('closes the open menu when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByTestId('menu-backdrop'));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('logs out on the server and in memory, then opens Log in', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.post(apiUrl('/auth/logout'), () => {
        calls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { store } = renderLayout();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('Log in page')).toBeInTheDocument();
    expect(calls).toBe(1);
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('still logs out locally when the logout request fails', async () => {
    const user = userEvent.setup();
    server.use(http.post(apiUrl('/auth/logout'), () => HttpResponse.error()));
    const { store } = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(store.getState().auth.accessToken).toBeNull());
    expect(await screen.findByText('Log in page')).toBeInTheDocument();
  });
});
