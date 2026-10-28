import { Link2 } from 'lucide-react';
import { PAGES } from './navigation';
import { cn } from '../../utils/cn';

export function Sidebar({ currentKey, onNavigate, open, onClose, user }) {
  return (
    <>
      {/* Mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-navy-800 bg-navy-900 text-navy-100 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary navigation"
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy-700 text-white ring-1 ring-navy-600">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide text-white">INSTITUTION-LINK</p>
            <p className="text-[11px] text-navy-300">Case Intelligence</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {PAGES.map((page) => {
            const Icon = page.icon;
            const active = page.key === currentKey;
            return (
              <button
                key={page.key}
                type="button"
                onClick={() => onNavigate(page.key)}
                aria-current={active ? 'page' : undefined}
                title={page.description}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition',
                  active
                    ? 'bg-navy-700 font-medium text-white shadow-inner'
                    : 'text-navy-200 hover:bg-navy-800 hover:text-white',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className="truncate">{page.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-navy-800 px-5 py-4">
          {user ? (
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-semibold text-white ring-1 ring-navy-600"
                aria-hidden="true"
              >
                {user.initials || '··'}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-medium text-white">{user.displayName}</p>
                <p className="truncate text-[11px] text-navy-300">{user.role}</p>
              </div>
            </div>
          ) : null}
          <p className="text-[11px] leading-relaxed text-navy-300">
            Prototype demonstration — fictional sample data; not connected to AICTE systems.
          </p>
        </div>
      </aside>
    </>
  );
}
