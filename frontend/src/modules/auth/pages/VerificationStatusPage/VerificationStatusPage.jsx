import { useId } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router';
import { ERROR_CODES } from '@real-estate/shared';
import backIcon from '../../../../assets/auth/icon-back-sm.svg';
import approvedIcon from '../../../../assets/auth/icon-status-approved.svg';
import pendingIcon from '../../../../assets/auth/icon-status-pending.svg';
import rejectedIcon from '../../../../assets/auth/icon-status-rejected.svg';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import UploadedFileCard from '../../../../components/ui/UploadedFileCard.jsx';
import { baseApi } from '../../../../services/api/baseApi.js';
import { useGetVerificationQuery, useLogoutMutation } from '../../api/authApi.js';
import { verificationOutcome } from '../../hooks/verificationOutcome.js';
import { AUTH_PATHS } from '../../routes.jsx';
import { loggedOut } from '../../store/authSlice.js';
import styles from './VerificationStatusPage.module.css';

// Shown when an entry has no file name (the GET pin lists only kind, status and reason).
const KIND_LABELS = {
  government_id: 'Government ID',
  company_registration_certificate: 'Company Registration Certificate',
  profile_photo: 'Profile Photo',
};

// Copy per headline, from Figma: Pending 13038:4703, Approved 13038:4765, Reject 13038:4825.
const SCREENS = {
  under_review: {
    lead: 'Your Account is ',
    accent: 'Under Review',
    subtitle: (
      <>
        Thank you for submitting your verification documents.
        <br />
        Our team is reviewing your account and it will be approved within 24–48 hours.
        <br />
        You will receive a notification once your account is active.
      </>
    ),
    tagline: 'Thank you for submitting your documents. We’ll notify you shortly.',
    icon: pendingIcon,
    iconSize: { width: 33.3333, height: 36.3567 },
    tone: 'pending',
  },
  active: {
    lead: 'Your Account is ',
    accent: 'Active!',
    subtitle: 'Your verification documents have been approved.',
    tagline: 'Congratulations! Your verification is complete.',
    icon: approvedIcon,
    iconSize: { width: 40, height: 40 },
    tone: 'approved',
  },
  unsuccessful: {
    lead: 'Verification ',
    accent: 'Unsuccessful',
    subtitle: (
      <>
        Unfortunately, your submitted documents could not be approved.
        <br />
        Please review the requirements and upload the correct documents to complete your account verification.
      </>
    ),
    tagline: 'Oops! Your submission wasn’t approved. Let’s fix it.',
    icon: rejectedIcon,
    iconSize: { width: 40, height: 40 },
    tone: 'rejected',
  },
};

// Developer status screens (Pending / Approved / Reject), one route. Developer only (ProtectedRoute;
// the API enforces it). The headline comes from the latest document of every required kind
// (verificationOutcome, DEC-022), and every required document is listed with its badge (2 or 3).
// A required kind with nothing uploaded yet opens Upload Document instead.
export default function VerificationStatusPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const listLabelId = useId();
  const { data: verification, isSuccess, error } = useGetVerificationQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Q-034 is open: the smallest safe "Back to login" ends the session (server and memory) and opens Log in.
  async function backToLogin() {
    try {
      await logout().unwrap();
    } catch {
      // POST /logout always succeeds per SPEC-001; if the request itself fails, the local session is
      // still cleared below and the refresh cookie simply expires.
    }
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate(AUTH_PATHS.login, { replace: true });
  }

  if (error) {
    return (
      <AuthSplitLayout title="Verification status" backLabel="Go back" backTo={null}>
        <p role="alert" className={styles.error}>
          {error.data?.error?.message ?? ERROR_CODES.INTERNAL_ERROR.message}
        </p>
      </AuthSplitLayout>
    );
  }
  if (!isSuccess) {
    // Not designed: the card keeps a neutral heading while the status loads.
    return <AuthSplitLayout title="Verification status" backLabel="Go back" backTo={null} />;
  }

  const documents = verification?.documents ?? [];
  if (documents.length === 0 || documents.some((document) => document.status == null)) {
    return <Navigate to={AUTH_PATHS.uploadDocuments} replace />;
  }

  const outcome = verificationOutcome(documents);
  const screen = SCREENS[outcome];

  return (
    <AuthSplitLayout
      title={
        <>
          {screen.lead}
          <span className={styles[screen.tone]}>{screen.accent}</span>
        </>
      }
      subtitle={screen.subtitle}
      tagline={screen.tagline}
      backLabel="Go back"
      backTo={null}
      contentGap={20}
      icon={
        <span className={[styles.badge, styles[`${screen.tone}Badge`]].join(' ')} aria-hidden="true">
          <span className={styles.glyph}>
            <img
              src={screen.icon}
              alt=""
              width={screen.iconSize.width}
              height={screen.iconSize.height}
              className={outcome === 'under_review' ? styles.clock : undefined}
            />
          </span>
        </span>
      }
    >
      <div className={styles.body}>
        <div className={styles.documents}>
          <p id={listLabelId} className={styles.listLabel}>
            Uploaded Document
          </p>
          <ul className={styles.list} aria-labelledby={listLabelId}>
            {documents.map((document) => (
              <li key={document.documentKind} className={styles.item}>
                <UploadedFileCard
                  name={document.fileName ?? KIND_LABELS[document.documentKind] ?? document.documentKind}
                  size={document.sizeBytes}
                  status={document.status}
                />
                {document.status === 'rejected' && document.rejectionReason && (
                  <p className={styles.reason}>
                    <span className={styles.rejected}>Reject reason: </span>
                    {document.rejectionReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {outcome === 'under_review' && (
          <Button className={styles.withIcon} onClick={backToLogin} disabled={isLoggingOut}>
            <img src={backIcon} alt="" width={8} height={16} />
            Back to login
          </Button>
        )}
        {outcome === 'active' && <Button onClick={() => navigate(AUTH_PATHS.plans)}>View plan</Button>}
        {outcome === 'unsuccessful' && (
          <Button onClick={() => navigate(AUTH_PATHS.uploadDocuments)}>Resubmit Documents</Button>
        )}
      </div>
    </AuthSplitLayout>
  );
}
