import ProtectedRoute from '../../components/routing/ProtectedRoute.jsx';
import StaffFormModal from './pages/StaffFormModal/StaffFormModal.jsx';
import StaffListPage from './pages/StaffListPage/StaffListPage.jsx';

// Frontend routes of the staff module (STAFF-DEC-011, docs/modules/staff/figma.md). Add, Detail and Edit
// are modals rendered by the list page's <Outlet />, so they open over the list.
export const STAFF_PATHS = {
  list: '/staff',
  add: '/staff/new',
  detail: (id) => `/staff/${id}`,
  edit: (id) => `/staff/${id}/edit`,
};

export const staffRoutes = [
  {
    element: <ProtectedRoute roles={['developer']} />,
    children: [
      {
        path: STAFF_PATHS.list,
        element: <StaffListPage />,
        children: [
          { path: 'new', element: <StaffFormModal mode="add" /> },
          { path: ':id/edit', element: <StaffFormModal mode="edit" /> },
        ],
      },
    ],
  },
];
