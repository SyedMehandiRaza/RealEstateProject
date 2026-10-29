import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';

// Temporary page for an auth route whose screen is not built yet (TASK-031).
// Each page ticket (TASK-033 to TASK-040) replaces its route's element with the real page.
export default function AuthPlaceholderPage({ title }) {
  return <AuthSplitLayout title={title} />;
}
