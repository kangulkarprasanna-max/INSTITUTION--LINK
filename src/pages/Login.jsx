// ---------------------------------------------------------------------------
// Login — demonstration sign-in screen.
//
// Prototype-only authentication: credentials come from src/data/users.js and a
// successful sign-in stores a localStorage session. The selectable accounts let
// an evaluator switch identity (and therefore see a role-labelled header)
// without typing anything.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  FlaskConical,
  Link2,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, Input } from '../components/ui/FormControls';
import { useAuth } from '../hooks/useAuth';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, USER_ROLE } from '../data/users';

const ROLE_TONE = {
  [USER_ROLE.NODAL]: 'info',
  [USER_ROLE.BUREAU_OFFICER]: 'assigned',
  [USER_ROLE.REVIEWER]: 'review',
};

const HIGHLIGHTS = [
  'One view of every complaint case against an institution',
  'Explainable cross-bureau matching that a reviewer confirms, never auto-merges',
  'Coordination tasks with owners, deadlines and a full action history',
  'Overdue detection and report exports for management review',
];

export function Login() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  // The short delay only exists so the button's disabled state is visible;
  // cancel it if the component goes away mid-flight.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmitting(true);
    timerRef.current = setTimeout(() => {
      const result = signIn(form.username, form.password);
      if (result.ok) {
        // Workspace takes over on the next render; nothing to clean up here.
        return;
      }
      setErrors({ form: result.error });
      setSubmitting(false);
    }, 350);
  }

  function fillAccount(account) {
    setErrors({});
    setForm({ username: account.username, password: DEMO_PASSWORD });
  }

  return (
    <div className="min-h-screen bg-navy-950 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <section className="hidden flex-col justify-between px-10 py-12 lg:flex xl:px-16">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-700 text-white ring-1 ring-navy-600">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide text-white">INSTITUTION-LINK</p>
            <p className="text-[11px] text-navy-300">Cross-Bureau Case Intelligence</p>
          </div>
        </div>

        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Every complaint case on one accountable record.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy-200">
            A working prototype for AICTE case handling across bureaus and cells — institution 360,
            related-case intelligence, coordination tasks and reporting.
          </p>
          <ul className="mt-6 space-y-2.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-navy-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] leading-relaxed text-navy-400">
          Prototype demonstration — fictional sample data; not connected to AICTE systems.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 lg:min-h-0 lg:bg-transparent lg:px-10">
        <div className="w-full max-w-md">
          <div className="card p-6 shadow-pop sm:p-7">
            <div className="lg:hidden">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy-700 text-white ring-1 ring-navy-600">
                  <Link2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold tracking-wide text-navy-900">INSTITUTION-LINK</p>
                  <p className="text-[11px] text-slate-500">Cross-Bureau Case Intelligence</p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-navy-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Officer access to the case intelligence workspace.
            </p>

            <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
              <Field label="User ID" htmlFor="login-username">
                <Input
                  id="login-username"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. r.iyer"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.form)}
                  icon={UserRound}
                />
              </Field>

              <Field label="Password" htmlFor="login-password">
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Prototype password"
                    autoComplete="current-password"
                    className="pr-10"
                    aria-invalid={Boolean(errors.form)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </Field>

              {errors.form ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {errors.form}
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                icon={LogIn}
                disabled={isSubmitting}
                title="Sign in to the prototype workspace"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Demonstration accounts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Select one to fill the form. Password for all:{' '}
                <code className="font-mono text-navy-700">{DEMO_PASSWORD}</code>
              </p>
              <ul className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.username}>
                    <button
                      type="button"
                      onClick={() => fillAccount(account)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-navy-300 hover:bg-navy-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-navy-800">
                          {account.displayName}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {account.designation}
                        </span>
                      </span>
                      <Badge tone={ROLE_TONE[account.role] || 'neutral'} className="shrink-0">
                        {account.role}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Prototype sign-in only — no real credentials are stored or checked against a server.
          </p>
        </div>
      </section>
    </div>
  );
}
