import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ERROR_CODES, staffMessages } from '@real-estate/shared';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { staffRoutes } from '../../../routes.jsx';

// STAFF-012: the Staff List page (STAFF-SPEC-001 §Pages, §States; STAFF-DEC-010).
const developer = { id: 1, fullName: 'Shivam Gawali', email: 'dev@example.com', roles: ['developer'] };
const member = (id, overrides = {}) => ({
  id,
  fullName: `Member ${id}`,
  email: `member${id}@example.com`,
  phone: '+917485961245',
  role: 'agent',
  status: 'active',
  createdAt: '2026-10-31T10:00:00.000Z',
  ...overrides,
});
const listResponse = (data, meta = {}) =>
  HttpResponse.json({
    success: true,
    data,
    meta: { page: 1, pageSize: 10, total: data.length, totalPages: Math.ceil(data.length / 10), ...meta },
  });

function renderPage(path = '/staff') {
  return renderWithProviders(
    [
      ...staffRoutes,
      { path: '/staff/:id', element: <p>Detail route</p> },
      { path: '/login', element: <p>Log in page</p> },
    ],
    {
      preloadedState: { auth: { accessToken: 'token', user: developer, restoringSession: false } },
      initialEntries: [path],
    },
  );
}

describe('StaffListPage', () => {
  it('shows the banner and the staff rows from the API, with labels and coloured status', async () => {
    server.use(
      http.get(apiUrl('/staff'), () =>
        listResponse([
          member(2, { fullName: 'Rajesh Mehta', email: 'rajesh@example.com', status: 'disabled' }),
          member(1, { fullName: 'Shivam Gawali' }),
        ]),
      ),
    );
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Staff Management' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Staff Management' })).toBeInTheDocument();
    expect(
      screen.getByText('Add team members to help manage properties, leads, and daily operations.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add Staff' })).toHaveAttribute('href', '/staff/new');

    const table = await screen.findByRole('table', { name: 'Staff List' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Rajesh Mehta')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Agent')).toBeInTheDocument();
    expect(within(rows[0]).getByText('rajesh@example.com')).toBeInTheDocument();
    expect(within(rows[0]).getByText('+917485961245')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Disable')).toHaveAttribute('data-status', 'disabled');
    expect(within(rows[1]).getByText('Active')).toHaveAttribute('data-status', 'active');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Name', 'Role', 'Email', 'Phone', 'Status', 'Action']);
  });

  it('links View and Edit to the member, and Remove to the member for now', async () => {
    server.use(http.get(apiUrl('/staff'), () => listResponse([member(7, { fullName: 'Rajesh Mehta' })])));
    renderPage();
    const row = (await screen.findAllByRole('row'))[1];
    expect(within(row).getByRole('link', { name: 'View Rajesh Mehta' })).toHaveAttribute('href', '/staff/7');
    expect(within(row).getByRole('link', { name: 'Edit Rajesh Mehta' })).toHaveAttribute(
      'href',
      '/staff/7/edit',
    );
    expect(within(row).getByRole('button', { name: 'Remove Rajesh Mehta' })).toBeInTheDocument();
  });

  it('asks for page 1 with 10 per page and hides page controls for 10 or fewer', async () => {
    let requested;
    server.use(
      http.get(apiUrl('/staff'), ({ request }) => {
        requested = new URL(request.url).searchParams.toString();
        return listResponse([member(1)]);
      }),
    );
    renderPage();
    await screen.findByText('Member 1');
    expect(requested).toBe('page=1&pageSize=10');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows page controls above 10 members and loads the next page', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiUrl('/staff'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return page === 1
          ? listResponse(
              Array.from({ length: 10 }, (_, i) => member(20 - i)),
              { total: 12, totalPages: 2 },
            )
          : listResponse([member(10), member(9)], { page: 2, total: 12, totalPages: 2 });
      }),
    );
    renderPage();
    const pagination = await screen.findByRole('navigation', { name: 'Pagination' });
    expect(within(pagination).getByText('Page 1 of 2')).toBeInTheDocument();
    expect(within(pagination).getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await user.click(within(pagination).getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Member 9')).toBeInTheDocument();
    expect(within(pagination).getByText('Page 2 of 2')).toBeInTheDocument();
    expect(within(pagination).getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('shows the empty state with the banner kept', async () => {
    server.use(http.get(apiUrl('/staff'), () => listResponse([])));
    renderPage();
    expect(await screen.findByText(staffMessages.ui.emptyList)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add Staff' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows skeleton rows while loading', async () => {
    server.use(http.get(apiUrl('/staff'), () => new Promise(() => {})));
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading staff' })).toBeInTheDocument();
  });

  it('shows the API message with Retry, and Retry loads the list', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.get(apiUrl('/staff'), () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              {
                success: false,
                error: { code: 'DEVELOPER_NOT_ACTIVE', message: ERROR_CODES.DEVELOPER_NOT_ACTIVE.message },
              },
              { status: 403 },
            )
          : listResponse([member(1)]);
      }),
    );
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.DEVELOPER_NOT_ACTIVE.message);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Member 1')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows the shared load-failed message when the network fails', async () => {
    server.use(http.get(apiUrl('/staff'), () => HttpResponse.error()));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(staffMessages.ui.loadFailed);
  });

  it('sends a logged-out visitor to Log in', async () => {
    renderWithProviders([...staffRoutes, { path: '/login', element: <p>Log in page</p> }], {
      initialEntries: ['/staff'],
    });
    expect(await screen.findByText('Log in page')).toBeInTheDocument();
  });
});
