import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ERROR_CODES, staffMessages } from '@real-estate/shared';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { staffRoutes } from '../../../routes.jsx';

// STAFF-015: Assign Property picker and Unassign on the Detail (STAFF-DEC-009, STAFF-DEC-015).
const developer = { id: 1, fullName: 'Developer One', email: 'dev@example.com', roles: ['developer'] };
const skyline = {
  id: 9,
  name: 'Skyline Tower',
  city: 'Mumbai',
  state: 'Maharashtra',
  propertyStatus: 'ready_to_move',
};
const harbor = {
  id: 4,
  name: 'Harbor View',
  city: 'Pune',
  state: 'Maharashtra',
  propertyStatus: 'under_construction',
};
const member = (assignedProperties) => ({
  id: 7,
  fullName: 'Shivam Gawali',
  email: 'shivam@example.com',
  phone: '+917485961245',
  role: 'agent',
  status: 'active',
  permissions: ['marketing'],
  assignedProperties,
  createdAt: '2026-10-31T10:00:00.000Z',
  updatedAt: '2026-10-31T10:00:00.000Z',
});
const ok = (staffMember, status = 200) =>
  HttpResponse.json({ success: true, data: { staffMember } }, { status });

function useApi({ assigned = [], assignable = [] } = {}) {
  server.use(
    http.get(apiUrl('/staff'), () =>
      HttpResponse.json({
        success: true,
        data: [],
        meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      }),
    ),
    http.get(apiUrl('/staff/7'), () => ok(member(assigned))),
    http.get(apiUrl('/staff/7/assignable-properties'), () =>
      HttpResponse.json({ success: true, data: { properties: assignable } }),
    ),
  );
}

function renderDetail() {
  return renderWithProviders([...staffRoutes], {
    preloadedState: { auth: { accessToken: 'token', user: developer, restoringSession: false } },
    initialEntries: ['/staff/7'],
  });
}

const detail = () => screen.findByRole('dialog', { name: 'Shivam Gawali' });
async function openPicker(user) {
  await user.click(within(await detail()).getByRole('button', { name: 'Assign Property' }));
  return screen.findByRole('dialog', { name: 'Assign Property' });
}

describe('Assign Property', () => {
  it('lists the assignable properties and assigns the chosen one', async () => {
    const user = userEvent.setup();
    useApi({ assignable: [harbor, skyline] });
    let body;
    server.use(
      http.post(apiUrl('/staff/7/properties'), async ({ request }) => {
        body = await request.json();
        return ok(member([{ ...skyline, assignedAt: '2026-10-31T11:00:00.000Z' }]), 201);
      }),
    );
    renderDetail();
    const picker = await openPicker(user);
    const options = await within(picker).findAllByRole('radio');
    expect(options.map((option) => option.closest('label').textContent)).toEqual([
      expect.stringContaining('Harbor View'),
      expect.stringContaining('Skyline Tower'),
    ]);
    expect(within(picker).getByText('Pune, Maharashtra')).toBeInTheDocument();
    expect(within(picker).getByText('Under construction')).toBeInTheDocument();
    const assign = within(picker).getByRole('button', { name: 'Assign' });
    expect(assign).toBeDisabled();

    await user.click(within(picker).getByRole('radio', { name: /Skyline Tower/ }));
    await user.click(assign);

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Assign Property' })).not.toBeInTheDocument(),
    );
    expect(body).toEqual({ propertyId: 9 });
    const cards = within(
      within(await detail()).getByRole('list', { name: 'Assigned Property' }),
    ).getAllByRole('listitem');
    expect(within(cards[0]).getByText('Skyline Tower')).toBeInTheDocument();
  });

  it('says the developer has no properties when there are none at all', async () => {
    const user = userEvent.setup();
    useApi();
    renderDetail();
    const picker = await openPicker(user);
    expect(await within(picker).findByText(staffMessages.ui.noProperties)).toBeInTheDocument();
    expect(within(picker).queryByRole('button', { name: 'Assign' })).not.toBeInTheDocument();
  });

  it('says every property is already assigned when the member has them all', async () => {
    const user = userEvent.setup();
    useApi({ assigned: [{ ...skyline, assignedAt: '2026-10-31T10:00:00.000Z' }] });
    renderDetail();
    const picker = await openPicker(user);
    expect(await within(picker).findByText(staffMessages.ui.allPropertiesAssigned)).toBeInTheDocument();
  });

  it('shows a 409 in the picker and reloads the list', async () => {
    const user = userEvent.setup();
    let assignableCalls = 0;
    useApi();
    server.use(
      http.get(apiUrl('/staff/7/assignable-properties'), () => {
        assignableCalls += 1;
        return HttpResponse.json({ success: true, data: { properties: [skyline] } });
      }),
      http.post(apiUrl('/staff/7/properties'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'CONFLICT', message: staffMessages.api.alreadyAssigned } },
          { status: 409 },
        ),
      ),
    );
    renderDetail();
    const picker = await openPicker(user);
    await user.click(await within(picker).findByRole('radio', { name: /Skyline Tower/ }));
    await user.click(within(picker).getByRole('button', { name: 'Assign' }));
    expect(await within(picker).findByRole('alert')).toHaveTextContent(staffMessages.api.alreadyAssigned);
    await waitFor(() => expect(assignableCalls).toBeGreaterThan(1));
  });

  it('closes with Cancel without assigning', async () => {
    const user = userEvent.setup();
    useApi({ assignable: [skyline] });
    renderDetail();
    const picker = await openPicker(user);
    await user.click(within(picker).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Assign Property' })).not.toBeInTheDocument(),
    );
    expect(await detail()).toBeInTheDocument();
  });
});

describe('Unassign', () => {
  it('removes the card at once', async () => {
    const user = userEvent.setup();
    useApi({
      assigned: [
        { ...skyline, assignedAt: '2026-10-31T10:00:00.000Z' },
        { ...harbor, assignedAt: '2026-10-30T10:00:00.000Z' },
      ],
    });
    let unassigned = false;
    server.use(
      http.delete(apiUrl('/staff/7/properties/9'), () => {
        unassigned = true;
        return ok(member([{ ...harbor, assignedAt: '2026-10-30T10:00:00.000Z' }]));
      }),
    );
    renderDetail();
    const d = await detail();
    await user.click(within(d).getByRole('button', { name: 'Unassign Skyline Tower' }));
    await waitFor(() => expect(within(d).queryByText('Skyline Tower')).not.toBeInTheDocument());
    expect(unassigned).toBe(true);
    expect(within(d).getByText('Harbor View')).toBeInTheDocument();
  });

  it('shows the error in the Detail and keeps the card', async () => {
    const user = userEvent.setup();
    useApi({ assigned: [{ ...skyline, assignedAt: '2026-10-31T10:00:00.000Z' }] });
    server.use(
      http.delete(apiUrl('/staff/7/properties/9'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: ERROR_CODES.INTERNAL_ERROR.message } },
          { status: 500 },
        ),
      ),
    );
    renderDetail();
    const d = await detail();
    await user.click(within(d).getByRole('button', { name: 'Unassign Skyline Tower' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent(ERROR_CODES.INTERNAL_ERROR.message);
    expect(within(d).getByText('Skyline Tower')).toBeInTheDocument();
  });
});
