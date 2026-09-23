export default function Table({ columns, data, keyField = '_id', onRowClick, empty, footer }) {
  if (!data || data.length === 0) {
    return <div>{empty}</div>;
  }
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row) => (
            <tr
              key={row[keyField] || row._id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                  {col.render ? col.render(row, data) : row[col.key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="bg-slate-50">{footer}</tfoot>}
      </table>
    </div>
  );
}