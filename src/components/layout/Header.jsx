import { Menu, RefreshCw, FlaskConical, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header({ title, subtitle, onOpenSidebar, onResetDemo, user, onSignOut }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-navy-900">{title}</p>
          {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
        </div>

        <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 lg:inline-flex">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          Prototype · fictional data
        </span>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={onResetDemo}
          title="Reset all demo data to the original sample dataset"
        >
          <span className="hidden sm:inline">Reset demo data</span>
        </Button>

        {user ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-semibold text-white"
              aria-hidden="true"
            >
              {user.initials || '··'}
            </span>
            <div className="hidden leading-tight xl:block">
              <p className="max-w-[150px] truncate text-[13px] font-medium text-navy-900">
                {user.displayName}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              onClick={onSignOut}
              title={`Sign out of ${user.displayName}`}
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
