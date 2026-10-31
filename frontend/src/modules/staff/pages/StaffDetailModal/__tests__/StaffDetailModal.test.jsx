import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ERROR_CODES, staffMessages } from '@real-estate/shared';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { staffRoutes } from '../../../routes.jsx';

// STAFF-014: the Staff Detail modal, its status change and the Remove confirmation (STAFF-DEC-011,
// STAFF-DEC-013, STAFF-DEC-014, STAFF-DEC-018), plus Remove from the list.
const developer = { id: 1, fullName: 'Developer One', email: 'dev@example.com', roles: ['developer'] };
const staffMember = {
  id: 7,
  fullName: 'Shivam Gawali',
  email: 'shivam@example.com',
  phone: '+917485961245',
  role: 'agent',
  status: 'active',
  permissions: ['properties_management', 'leads_crm', 'payment_tracking'],
  assignedProperties: [
    {
      id: 9,
      name: 'Skyline Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      propertyStatus: 'ready_to_move',
      assignedAt: '2026-10-31T10:00:00.000Z',
    },
    {
      id: 4,
      name: 'Harbor View',
      city: 'Pune',
      state: 'Maharashtra',
      propertyStatus: 'under_construction',
      assignedAt: '2026-10-30T10:00:00.000Z',
    },
  ],
  createdAt: '2026-10-31T10:00:00.000Z',
  updatedAt: '2026-10-31T10:00:00.000Z',
};
const summary = ({ id, fullName, email, phone, role, status, createdAt }) => ({
  id,
  fullName,
  email,
  phone,
  role,
  status,
  createdAt,
});

function useApi({ member = staffMember, list = [summary(staffMember)] } = {}) {
  server.use(
    http.get(apiUrl('/staff'), () =>
      HttpResponse.json({
        success: true,
        data: list,
        meta: { page: 1, pageSize: 10, total: list.length, totalPages: 1 },
      }),
    ),
    http.get(apiUrl('/staff/7'), () => HttpResponse.json({ success: true, data: { staffMember: member } })),
  );
}

function renderAt(path) {
  return renderWithProviders(
    [
      ...staffRoutes,
      { path: '/properties/:id', element: <p>Property page</p> },
      { path: '/login', element: <p>Log in page</p> },
    ],
    {
      preloadedState: { auth: { accessToken: 'token', user: developer, restoringSession: false } },
      initialEntries: [path],
    },
  );
}

const findDetail = () => screen.findByRole('dialog', { name: 'Shivam Gawali' });

describe('Staff Detail modal', () => {
  it('shows the member: initials, name, role, contact strip and the five areas', async () => {
    useApi();
    renderAt('/staff/7');
    const d = await findDetail();
    expect(within(d).getByRole('img', { name: 'Shivam Gawali' })).toHaveTextContent('SG');
    expect(within(d).getByText('Agent')).toBeInTheDocument();
    expect(within(d).getByText('+917485961245')).toBeInTheDocument();
    expect(within(d).getByText('Phone number')).toBeInTheDocument();
    expect(within(d).getByText('shivam@example.com')).toBeInTheDocument();
    expect(within(d).getByText('Email Address')).toBeInTheDocument();
    expect(within(d).getByTestId('status-value')).toHaveTextContent('Active');

    const areas = within(within(d).getByRole('list', { name: 'Assigned Permissions / Access' })).getAllByRole(
      'listitem',
    );
    expect(areas.map((item) => item.textContent)).toEqual([
      'Properties Management',
      'Leads & CRM',
      'Payment Tracking',
      'Marketing',
      'Facility Management',
    ]);
    expect(within(areas[0]).getByRole('img', { name: 'Granted' })).toBeInTheDocument();
    expect(within(areas[3]).getByRole('img', { name: 'Not granted' })).toBeInTheDocument();
  });

  it('shows the assigned properties with location, status badge and View Property, without leads', async () => {
    useApi();
    renderAt('/staff/7');
    const d = await findDetail();
    const cards = within(within(d).getByRole('list', { name: 'Assigned Property' })).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('Skyline Tower')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Mumbai, Maharashtra')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Ready to move')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Under construction')).toBeInTheDocument();
    expect(within(cards[0]).getByRole('link', { name: 'View Property' })).toHaveAttribute(
      'href',
      '/properties/9',
    );
    expect(within(d).queryByText(/Leads Assigned/)).not.toBeInTheDocument();
  });

  it('shows the empty message when no property is assigned', async () => {
    useApi({ member: { ...staffMember, assignedProperties: [] } });
    renderAt('/staff/7');
    expect(
      await within(await findDetail()).findByText(staffMessages.ui.noPropertiesAssigned),
    ).toBeInTheDocument();
  });

  it('changes the status at once from the dropdown', async () => {
    const user = userEvent.setup();
    useApi();
    let body;
    server.use(
      http.patch(apiUrl('/staff/7/status'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: true,
          data: { staffMember: { ...staffMember, status: body.status } },
        });
      }),
    );
    renderAt('/staff/7');
    const d = await findDetail();
    const status = within(d).getByRole('combobox', { name: 'Status' });
    expect(status).toHaveTextContent('Active');

    await user.click(status);
    await user.click(within(d).getByRole('option', { name: 'Disable' }));

    await waitFor(() => expect(body).toEqual({ status: 'disabled' }));
    await waitFor(() => expect(within(d).getByTestId('status-value')).toHaveTextContent('Disable'));
    expect(status).toHaveTextContent('Disable');
  });

  it('keeps the old status and shows the message when the change fails', async () => {
    const user = userEvent.setup();
    useApi();
    server.use(
      http.patch(apiUrl('/staff/7/status'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: ERROR_CODES.INTERNAL_ERROR.message } },
          { status: 500 },
        ),
      ),
    );
    renderAt('/staff/7');
    const d = await findDetail();
    await user.click(within(d).getByRole('combobox', { name: 'Status' }));
    await user.click(within(d).getByRole('option', { name: 'Disable' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent(ERROR_CODES.INTERNAL_ERROR.message);
    expect(within(d).getByRole('combobox', { name: 'Status' })).toHaveTextContent('Active');
  });

  it('opens Edit with the Detail as the place to return to', async () => {
    const user = userEvent.setup();
    useApi();
    const { router } = renderAt('/staff/7');
    await user.click(within(await findDetail()).getByRole('link', { name: 'Edit' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/7/edit'));
    expect(router.state.location.state).toEqual({ returnTo: '/staff/7' });
  });

  it('removes the member after confirmation and returns to the list', async () => {
    const user = userEvent.setup();
    useApi();
    let deleted = false;
    server.use(
      http.delete(apiUrl('/staff/7'), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderAt('/staff/7');
    await user.click(within(await findDetail()).getByRole('button', { name: 'Remove Staff' }));

    const confirm = await screen.findByRole('dialog', {
      name: staffMessages.ui.removeTitle('Shivam Gawali'),
    });
    expect(within(confirm).getByText(staffMessages.ui.removeBody)).toBeInTheDocument();
    await user.click(within(confirm).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/staff'));
    expect(deleted).toBe(true);
  });

  it('keeps the member when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    useApi();
    renderAt('/staff/7');
    await user.click(within(await findDetail()).getByRole('button', { name: 'Remove Staff' }));
    const confirm = await screen.findByRole('dialog', {
      name: staffMessages.ui.removeTitle('Shivam Gawali'),
    });
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: staffMessages.ui.removeTitle('Shivam Gawali') }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'Shivam Gawali' })).toBeInTheDocument();
  });

  it('closes only the confirmation on Escape, keeping the Detail open', async () => {
    const user = userEvent.setup();
    useApi();
    renderAt('/staff/7');
    await user.click(within(await findDetail()).getByRole('button', { name: 'Remove Staff' }));
    await screen.findByRole('dialog', { name: staffMessages.ui.removeTitle('Shivam Gawali') });
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: staffMessages.ui.removeTitle('Shivam Gawali') }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'Shivam Gawali' })).toBeInTheDocument();
  });

  it('returns to the list when the member was already removed (404)', async () => {
    const user = userEvent.setup();
    useApi();
    server.use(
      http.delete(apiUrl('/staff/7'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: staffMessages.api.notFound } },
          { status: 404 },
        ),
      ),
    );
    const { router } = renderAt('/staff/7');
    await user.click(within(await findDetail()).getByRole('button', { name: 'Remove Staff' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: /Remove/ })).getByRole('button', { name: 'Remove' }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff'));
  });

  it('shows other remove errors inside the confirmation', async () => {
    const user = userEvent.setup();
    useApi();
    server.use(
      http.delete(apiUrl('/staff/7'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: ERROR_CODES.INTERNAL_ERROR.message } },
          { status: 500 },
        ),
      ),
    );
    renderAt('/staff/7');
    await user.click(within(await findDetail()).getByRole('button', { name: 'Remove Staff' }));
    const confirm = await screen.findByRole('dialog', { name: /Remove/ });
    await user.click(within(confirm).getByRole('button', { name: 'Remove' }));
    expect(await within(confirm).findByRole('alert')).toHaveTextContent(ERROR_CODES.INTERNAL_ERROR.message);
  });

  it('shows "Staff member not found" for an unknown member, with Close', async () => {
    const user = userEvent.setup();
    useApi();
    server.use(
      http.get(apiUrl('/staff/99'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: staffMessages.api.notFound } },
          { status: 404 },
        ),
      ),
    );
    const { router } = renderAt('/staff/99');
    const d = await screen.findByRole('dialog');
    expect(await within(d).findByText(staffMessages.api.notFound)).toBeInTheDocument();
    await user.click(within(d).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff'));
  });
});

describe('Remove from the Staff List', () => {
  it('asks for confirmation, removes the member and refreshes the list', async () => {
    const user = userEvent.setup();
    let list = [summary(staffMember)];
    server.use(
      http.get(apiUrl('/staff'), () =>
        HttpResponse.json({
          success: true,
          data: list,
          meta: { page: 1, pageSize: 10, total: list.length, totalPages: 1 },
        }),
      ),
      http.delete(apiUrl('/staff/7'), () => {
        list = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAt('/staff');
    await user.click(await screen.findByRole('button', { name: 'Remove Shivam Gawali' }));
    const confirm = await screen.findByRole('dialog', {
      name: staffMessages.ui.removeTitle('Shivam Gawali'),
    });
    await user.click(within(confirm).getByRole('button', { name: 'Remove' }));
    expect(await screen.findByText(staffMessages.ui.emptyList)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// Code review fix (STAFF-020): a removed member's Detail is not served from the cache.
it('does not show a removed member from the cache', async () => {
  const user = userEvent.setup();
  let removed = false;
  useApi();
  server.use(
    http.get(apiUrl('/staff/7'), () =>
      removed
        ? HttpResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: staffMessages.api.notFound } },
            { status: 404 },
          )
        : HttpResponse.json({ success: true, data: { staffMember } }),
    ),
    http.delete(apiUrl('/staff/7'), () => {
      removed = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { router } = renderAt('/staff/7');
  await findDetail();
  await user.click(screen.getByRole('button', { name: 'Close' }));
  await user.click(await screen.findByRole('button', { name: 'Remove Shivam Gawali' }));
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove' }));
  await waitFor(() => expect(removed).toBe(true));

  await router.navigate('/staff/7');
  expect(
    await within(await screen.findByRole('dialog')).findByText(staffMessages.api.notFound),
  ).toBeInTheDocument();
});
