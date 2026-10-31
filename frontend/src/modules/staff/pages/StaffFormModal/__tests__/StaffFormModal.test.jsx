import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ERROR_CODES, staffMessages } from '@real-estate/shared';
import { staffMemberCases } from '@real-estate/shared/testing';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { staffRoutes } from '../../../routes.jsx';

// STAFF-013: Add Staff and Edit Staff modals and the success modal (STAFF-DEC-011, STAFF-DEC-012).
const developer = { id: 1, fullName: 'Shivam Gawali', email: 'dev@example.com', roles: ['developer'] };
const emptyList = () =>
  HttpResponse.json({ success: true, data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
const staffMember = {
  id: 7,
  fullName: 'Rajesh Mehta',
  email: 'rajesh@example.com',
  phone: '+917485961245',
  role: 'agent',
  status: 'disabled',
  permissions: ['leads_crm', 'marketing'],
  assignedProperties: [],
  createdAt: '2026-10-31T10:00:00.000Z',
  updatedAt: '2026-10-31T10:00:00.000Z',
};

function renderAt(path, state) {
  server.use(http.get(apiUrl('/staff'), emptyList));
  return renderWithProviders([...staffRoutes, { path: '/login', element: <p>Log in page</p> }], {
    preloadedState: { auth: { accessToken: 'token', user: developer, restoringSession: false } },
    initialEntries: [state ? { pathname: path, state } : path],
  });
}

const dialog = () => screen.getByRole('dialog');

async function fillValidForm(user, values = staffMemberCases.valid) {
  const d = dialog();
  await user.clear(within(d).getByLabelText('Full Name'));
  await user.type(within(d).getByLabelText('Full Name'), values.fullName);
  await user.clear(within(d).getByLabelText('Email'));
  await user.type(within(d).getByLabelText('Email'), values.email);
  await user.clear(within(d).getByLabelText('Phone Number'));
  await user.type(within(d).getByLabelText('Phone Number'), values.phone);
  await user.click(within(d).getByRole('combobox', { name: /Role/ }));
  await user.click(within(d).getByRole('option', { name: 'Agent' }));
  await user.click(within(d).getByRole('combobox', { name: /Assign Access Permissions/ }));
  for (const permission of values.permissions) {
    await user.click(within(d).getByRole('option', { name: staffMessages.labels.permissions[permission] }));
  }
  await user.keyboard('{Escape}');
}

describe('Add Staff modal', () => {
  it('shows the Figma form over the list', async () => {
    renderAt('/staff/new');
    const d = await screen.findByRole('dialog', { name: 'Add Staff' });
    expect(within(d).getByLabelText('Full Name')).toHaveAttribute('placeholder', 'Enter Full Name');
    expect(within(d).getByLabelText('Email')).toHaveAttribute('placeholder', 'Enter Email');
    expect(within(d).getByLabelText('Phone Number')).toHaveAttribute('placeholder', 'Enter Phone Number');
    expect(within(d).getByRole('combobox', { name: /Role/ })).toHaveTextContent('Select');
    expect(within(d).getByRole('combobox', { name: /Assign Access Permissions/ })).toHaveTextContent(
      'Select',
    );
    expect(within(d).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Add Staff' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Staff List' })).toBeInTheDocument();
  });

  it('shows every required message when submitted empty, and sends nothing', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(http.post(apiUrl('/staff'), () => ((posted = true), HttpResponse.json({}))));
    renderAt('/staff/new');
    await user.click(await screen.findByRole('button', { name: 'Add Staff' }));
    for (const message of [
      staffMessages.fullName.required,
      staffMessages.email.required,
      staffMessages.phone.required,
      staffMessages.role.invalid,
      staffMessages.permissions.required,
    ]) {
      expect(await within(dialog()).findByText(message)).toBeInTheDocument();
    }
    expect(posted).toBe(false);
  });

  const typedCases = staffMemberCases.invalid.filter(
    ({ field, input }) =>
      ['fullName', 'email', 'phone'].includes(field) &&
      typeof input[field] === 'string' &&
      input[field].trim() !== '',
  );
  it.each(typedCases)(
    'shows the shared message for $name (client parity)',
    async ({ input, field, message }) => {
      const user = userEvent.setup();
      renderAt('/staff/new');
      const label = { fullName: 'Full Name', email: 'Email', phone: 'Phone Number' }[field];
      await user.type(await within(await screen.findByRole('dialog')).findByLabelText(label), input[field]);
      await user.click(within(dialog()).getByRole('button', { name: 'Add Staff' }));
      expect(await within(dialog()).findByText(message)).toBeInTheDocument();
    },
  );

  it('shows the chosen permissions joined by commas in the shared order', async () => {
    const user = userEvent.setup();
    renderAt('/staff/new');
    const combobox = await within(await screen.findByRole('dialog')).findByRole('combobox', {
      name: /Assign Access Permissions/,
    });
    await user.click(combobox);
    const listbox = within(dialog()).getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await user.click(within(listbox).getByRole('option', { name: 'Marketing' }));
    await user.click(within(listbox).getByRole('option', { name: 'Leads & CRM' }));
    expect(within(listbox).getByRole('option', { name: 'Marketing' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(within(listbox).getByRole('option', { name: 'Marketing' }));
    await user.click(within(listbox).getByRole('option', { name: 'Payment Tracking' }));
    await user.keyboard('{Escape}');
    expect(combobox).toHaveTextContent('Leads & CRM, Payment Tracking');
  });

  it('adds the member, shows Successfully Added, and Done returns to the list', async () => {
    const user = userEvent.setup();
    let body;
    server.use(
      http.post(apiUrl('/staff'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: { staffMember } }, { status: 201 });
      }),
    );
    renderAt('/staff/new');
    await screen.findByRole('dialog');
    await fillValidForm(user);
    await user.click(within(dialog()).getByRole('button', { name: 'Add Staff' }));

    const success = await screen.findByRole('dialog', { name: staffMessages.ui.addedTitle });
    expect(within(success).getByText(staffMessages.ui.addedBody)).toBeInTheDocument();
    expect(body).toEqual({
      fullName: 'Rajesh Mehta',
      email: 'rajesh@example.com',
      phone: '+917485961245',
      role: 'agent',
      permissions: ['properties_management', 'leads_crm'],
    });

    await user.click(within(success).getByRole('button', { name: 'Done.' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Staff List' })).toBeInTheDocument();
  });

  it.each([
    ['a duplicate email', staffMessages.email.taken],
    ["the developer's own email", staffMessages.email.self],
  ])('shows the server message for %s under Email (server parity)', async (_, message) => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/staff'), () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'CONFLICT', message: ERROR_CODES.CONFLICT.message, fields: { email: [message] } },
          },
          { status: 409 },
        ),
      ),
    );
    renderAt('/staff/new');
    await screen.findByRole('dialog');
    await fillValidForm(user);
    await user.click(within(dialog()).getByRole('button', { name: 'Add Staff' }));
    expect(await within(dialog()).findByText(message)).toBeInTheDocument();
    expect(within(dialog()).getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an error that is not about a field in a form alert', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/staff'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: ERROR_CODES.INTERNAL_ERROR.message } },
          { status: 500 },
        ),
      ),
    );
    renderAt('/staff/new');
    await screen.findByRole('dialog');
    await fillValidForm(user);
    await user.click(within(dialog()).getByRole('button', { name: 'Add Staff' }));
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent(ERROR_CODES.INTERNAL_ERROR.message);
  });

  it('disables the submit button while saving', async () => {
    const user = userEvent.setup();
    server.use(http.post(apiUrl('/staff'), () => new Promise(() => {})));
    renderAt('/staff/new');
    await screen.findByRole('dialog');
    await fillValidForm(user);
    await user.click(within(dialog()).getByRole('button', { name: 'Add Staff' }));
    await waitFor(() => expect(within(dialog()).getByRole('button', { name: 'Add Staff' })).toBeDisabled());
  });

  it.each([
    ['Cancel', (user) => user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))],
    ['the close icon', (user) => user.click(within(dialog()).getByRole('button', { name: 'Close' }))],
    ['Escape', (user) => user.keyboard('{Escape}')],
  ])('closes with %s without saving', async (_, close) => {
    const user = userEvent.setup();
    renderAt('/staff/new');
    await screen.findByRole('dialog');
    await close(user);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Staff List' })).toBeInTheDocument();
  });
});

describe('Edit Staff modal', () => {
  it('is prefilled from the member, saves with PUT and returns to the list without a success modal', async () => {
    const user = userEvent.setup();
    let body;
    server.use(
      http.get(apiUrl('/staff/7'), () => HttpResponse.json({ success: true, data: { staffMember } })),
      http.put(apiUrl('/staff/7'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: { staffMember: { ...staffMember, ...body } } });
      }),
    );
    renderAt('/staff/7/edit');

    const d = await screen.findByRole('dialog', { name: 'Edit Staff' });
    await waitFor(() => expect(within(d).getByLabelText('Full Name')).toHaveValue('Rajesh Mehta'));
    expect(within(d).getByLabelText('Email')).toHaveValue('rajesh@example.com');
    expect(within(d).getByLabelText('Phone Number')).toHaveValue('+917485961245');
    expect(within(d).getByRole('combobox', { name: /Role/ })).toHaveTextContent('Agent');
    expect(within(d).getByRole('combobox', { name: /Assign Access Permissions/ })).toHaveTextContent(
      'Leads & CRM, Marketing',
    );

    await user.clear(within(d).getByLabelText('Full Name'));
    await user.type(within(d).getByLabelText('Full Name'), 'Rajesh K Mehta');
    await user.click(within(d).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(body).toEqual({
      fullName: 'Rajesh K Mehta',
      email: 'rajesh@example.com',
      phone: '+917485961245',
      role: 'agent',
      permissions: ['leads_crm', 'marketing'],
    });
    expect(screen.getByRole('heading', { name: 'Staff List' })).toBeInTheDocument();
  });

  it('returns to the Detail when it was opened from there', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiUrl('/staff/7'), () => HttpResponse.json({ success: true, data: { staffMember } })),
      http.put(apiUrl('/staff/7'), () => HttpResponse.json({ success: true, data: { staffMember } })),
    );
    const { router } = renderAt('/staff/7/edit', { returnTo: '/staff/7' });
    const d = await screen.findByRole('dialog', { name: 'Edit Staff' });
    await waitFor(() => expect(within(d).getByLabelText('Full Name')).toHaveValue('Rajesh Mehta'));
    await user.click(within(d).getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/7'));
  });

  it('shows "Staff member not found" for an unknown member', async () => {
    server.use(
      http.get(apiUrl('/staff/99'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: staffMessages.api.notFound } },
          { status: 404 },
        ),
      ),
    );
    renderAt('/staff/99/edit');
    const d = await screen.findByRole('dialog');
    expect(await within(d).findByText(staffMessages.api.notFound)).toBeInTheDocument();
    expect(within(d).queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });
});
