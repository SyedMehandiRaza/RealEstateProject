import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { LIMITS, staffMessages } from '@real-estate/shared';
import addIcon from '../../../../assets/staff/add.svg';
import DeveloperLayout from '../../../../components/layout/DeveloperLayout.jsx';
import Pagination from '../../../../components/ui/Pagination.jsx';
import { apiErrorMessage, useListStaffQuery } from '../../api/staffApi.js';
import RemoveStaffModal from '../../components/RemoveStaffModal.jsx';
import StaffBannerArt from '../../components/StaffBannerArt.jsx';
import { STAFF_PATHS } from '../../routes.jsx';
import styles from './StaffListPage.module.css';

const { labels } = staffMessages;
const COLUMNS = ['Name', 'Role', 'Email', 'Phone', 'Status', 'Action'];

// Staff Management (Figma 13009:17816, STAFF-012). Add, Detail and Edit open over it through <Outlet />.
export default function StaffListPage() {
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState(null);
  // currentData is the answer for this page only (never the previous page while a new one loads or fails);
  // data keeps the last answer, so the page controls stay usable during a change.
  const { data, currentData, error, isFetching, isError, refetch } = useListStaffQuery({
    page,
    pageSize: LIMITS.staff.listPageSize,
  });
  const members = currentData?.data ?? [];
  const lastPage = Math.max(1, currentData?.meta.totalPages ?? 1);

  // A removal can empty the last page (or another tab removed members): go back to the last page there is.
  // Adjusted while rendering, as React recommends for state that follows new data.
  if (currentData && page > lastPage) setPage(lastPage);

  return (
    <DeveloperLayout title="Staff Management">
      <section className={styles.banner} aria-labelledby="staff-banner-title">
        <StaffBannerArt />
        <div className={styles.bannerText}>
          <div className={styles.bannerCopy}>
            <h2 id="staff-banner-title" className={styles.bannerTitle}>
              Staff Management
            </h2>
            <p className={styles.bannerDescription}>
              Add team members to help manage properties, leads, and daily operations.
            </p>
          </div>
          <Link to={STAFF_PATHS.add} className={styles.addButton}>
            <img src={addIcon} alt="" width="24" height="24" />
            Add Staff
          </Link>
        </div>
      </section>

      <section className={styles.listCard} aria-labelledby="staff-list-title">
        <h2 id="staff-list-title" className={styles.listTitle}>
          Staff List
        </h2>

        {!currentData && isFetching && (
          <div role="status" aria-label="Loading staff" className={styles.skeleton}>
            {[0, 1, 2].map((row) => (
              <span key={row} className={styles.skeletonRow} />
            ))}
          </div>
        )}

        {isError && !isFetching && (
          <div role="alert" className={styles.error}>
            <p>{apiErrorMessage(error, staffMessages.ui.loadFailed)}</p>
            <button type="button" className={styles.retry} onClick={refetch}>
              Retry
            </button>
          </div>
        )}

        {currentData && members.length === 0 && page <= lastPage && (
          <p className={styles.empty}>{staffMessages.ui.emptyList}</p>
        )}

        {members.length > 0 && (
          <table role="table" className={styles.table} aria-labelledby="staff-list-title">
            <thead role="rowgroup">
              <tr role="row">
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" role="columnheader">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {members.map((member) => (
                <tr key={member.id} role="row">
                  <td role="cell" data-label="Name">
                    {member.fullName}
                  </td>
                  <td role="cell" data-label="Role">
                    {labels.roles[member.role]}
                  </td>
                  <td role="cell" data-label="Email" className={styles.email}>
                    {member.email}
                  </td>
                  <td role="cell" data-label="Phone">
                    {member.phone}
                  </td>
                  <td role="cell" data-label="Status">
                    <span className={styles.status} data-status={member.status}>
                      {labels.statuses[member.status]}
                    </span>
                  </td>
                  <td role="cell" data-label="Action">
                    <span className={styles.actions}>
                      <Link
                        to={STAFF_PATHS.detail(member.id)}
                        className={styles.view}
                        aria-label={`View ${member.fullName}`}
                      >
                        View
                      </Link>
                      <span aria-hidden="true">/</span>
                      <Link
                        to={STAFF_PATHS.edit(member.id)}
                        className={styles.edit}
                        aria-label={`Edit ${member.fullName}`}
                      >
                        Edit
                      </Link>
                      <span aria-hidden="true">/</span>
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`Remove ${member.fullName}`}
                        onClick={() => setRemoving(member)}
                      >
                        Remove
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />}
      </section>

      <Outlet />
      {removing && (
        <RemoveStaffModal
          member={removing}
          onCancel={() => setRemoving(null)}
          onRemoved={() => setRemoving(null)}
        />
      )}
    </DeveloperLayout>
  );
}
