import { Component } from 'react';
import { Link2, RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from './ui/Button';

/**
 * Last line of defence: without it a render-time throw anywhere in a page
 * unmounts the whole tree and leaves a blank white screen, which is the worst
 * possible failure during a live demonstration.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the detail in the console for whoever is debugging the prototype.
    console.error('INSTITUTION-LINK failed to render:', error, info?.componentStack);
  }

  handleRetry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <div className="card w-full max-w-lg p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy-700 text-white ring-1 ring-navy-600">
              <Link2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide text-navy-900">INSTITUTION-LINK</p>
              <p className="text-[11px] text-slate-500">Case Intelligence</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-rose-800">This screen could not be displayed.</p>
              <p className="mt-1 text-xs leading-relaxed text-rose-700">
                Nothing was deleted — case data stays in this browser. Retry the screen, or reload to
                start from the dashboard.
              </p>
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-slate-600">
              Technical details
            </summary>
            <p className="mt-2 break-words rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600">
              {String(error?.message || error)}
            </p>
          </details>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button icon={RotateCcw} onClick={this.handleRetry}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload app
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
