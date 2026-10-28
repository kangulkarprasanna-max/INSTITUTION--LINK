import { cn } from '../../utils/cn';

/**
 * Compact, legible data-table primitives.
 * `<Table columns={[{key,header,render?,align?}]} rows={[]} rowKey={(r)=>r.id} onRowClick={(row)=>...} />`
 *
 * When `onRowClick` is provided each row becomes keyboard-accessible
 * (focusable, activatable with Enter/Space) so detail views open reliably.
 */
export function Table({ columns, rows, rowKey, empty = null, className = '', onRowClick }) {
  const clickable = typeof onRowClick === 'function';

  function handleKeyDown(e, row) {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(row);
    }
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-slate-400">
                {empty ?? 'No records to display.'}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                onClick={clickable ? () => onRowClick(row) : undefined}
                onKeyDown={clickable ? (e) => handleKeyDown(e, row) : undefined}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? 'button' : undefined}
                aria-label={clickable ? `Open ${rowKey ? rowKey(row, idx) : 'row'}` : undefined}
                className={cn(
                  'border-b border-slate-100 last:border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-500',
                  clickable
                    ? 'cursor-pointer hover:bg-navy-50/60'
                    : 'hover:bg-slate-50/70',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2.5 align-middle text-slate-700',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
