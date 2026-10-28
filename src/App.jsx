import { useCallback, useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { getPage } from './components/layout/navigation';
import { NavContext } from './hooks/navigation';
import { DataProvider, useData } from './hooks/useData';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Institutions } from './pages/Institutions';
import { InstitutionDetail } from './pages/InstitutionDetail';
import { CaseRegistry } from './pages/CaseRegistry';
import { CaseDetail } from './pages/CaseDetail';
import { TaskDetail } from './pages/TaskDetail';
import { CrossBureau } from './pages/CrossBureau';
import { Coordination } from './pages/Coordination';
import { Analytics } from './pages/Analytics';

// Top-level pages reachable from the sidebar.
const LIST_PAGES = {
  dashboard: Dashboard,
  institutions: Institutions,
  cases: CaseRegistry,
  'cross-bureau': CrossBureau,
  coordination: Coordination,
  analytics: Analytics,
};

// Header metadata for non-sidebar detail routes. `baseKey` keeps the matching
// sidebar item highlighted while a detail view is open.
const DETAIL_META = {
  institution: { baseKey: 'institutions', title: 'Institution 360', subtitle: 'Consolidated institution case profile' },
  case: { baseKey: 'cases', title: 'Case Detail', subtitle: 'Inspect, update and maintain a complaint case' },
  task: { baseKey: 'coordination', title: 'Coordination Task', subtitle: 'Accountability, deadlines and coordinated progress' },
};

function Workspace() {
  const { resetDemoData } = useData();
  const { user, signOut } = useAuth();
  const [route, setRoute] = useState({ key: 'dashboard', params: {} });
  const [history, setHistory] = useState([]);

  const navigate = useCallback(
    (key, params = {}) => {
      setHistory((h) => [...h, route]);
      setRoute({ key, params });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    },
    [route],
  );

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) {
        setRoute({ key: 'dashboard', params: {} });
        return h;
      }
      setRoute(h[h.length - 1]);
      return h.slice(0, -1);
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  // Sidebar navigation resets history (top-level jump).
  const navigateTopLevel = useCallback((key) => {
    setHistory([]);
    setRoute({ key, params: {} });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const handleReset = useCallback(() => {
    const ok = window.confirm(
      'Reset all demonstration data to the original sample dataset? This clears local edits.',
    );
    if (ok) {
      resetDemoData();
      navigateTopLevel('dashboard');
    }
  }, [resetDemoData, navigateTopLevel]);

  const isDetail = Boolean(DETAIL_META[route.key]);
  const activeKey = isDetail ? DETAIL_META[route.key].baseKey : route.key;

  const headerMeta = useMemo(() => {
    if (isDetail) {
      const m = DETAIL_META[route.key];
      return { title: m.title, subtitle: m.subtitle };
    }
    const p = getPage(route.key);
    return { title: p.label, subtitle: p.description };
  }, [isDetail, route.key]);

  const navValue = useMemo(
    () => ({ route, navigate, goBack, canGoBack: history.length > 0 }),
    [route, navigate, goBack, history.length],
  );

  function renderPage() {
    if (route.key === 'institution') {
      return <InstitutionDetail institutionId={route.params.institutionId} />;
    }
    if (route.key === 'case') {
      return <CaseDetail caseId={route.params.caseId} />;
    }
    if (route.key === 'task') {
      return <TaskDetail taskId={route.params.taskId} />;
    }
    const Page = LIST_PAGES[route.key] || Dashboard;
    return <Page />;
  }

  return (
    <NavContext.Provider value={navValue}>
      <AppShell
        activeKey={activeKey}
        onNavigate={navigateTopLevel}
        onResetDemo={handleReset}
        title={headerMeta.title}
        subtitle={headerMeta.subtitle}
        user={user}
        onSignOut={signOut}
      >
        {renderPage()}
      </AppShell>
    </NavContext.Provider>
  );
}

// The workspace is only mounted for a signed-in user; signing out unmounts it,
// so navigation state resets and the next visit starts back at the login screen.
function Root() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Workspace /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Root />
      </DataProvider>
    </AuthProvider>
  );
}
