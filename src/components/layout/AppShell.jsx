import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * Reusable application shell. Owns only presentational concerns (responsive
 * sidebar toggle); routing state is provided by App via props + NavContext.
 */
export function AppShell({
  activeKey,
  onNavigate,
  onResetDemo,
  title,
  subtitle,
  user,
  onSignOut,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNavigate(key) {
    onNavigate(key);
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        currentKey={activeKey}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenSidebar={() => setSidebarOpen(true)}
          onResetDemo={onResetDemo}
          user={user}
          onSignOut={onSignOut}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
