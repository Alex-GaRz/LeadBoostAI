import React from 'react';

interface TableProps {
  columns: string[];
  data: any[];
  rowActions?: (row: any) => React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ columns, data, rowActions, className }) => {
  return (
    <table className={["w-full bg-card rounded-xl border border-border", className].join(' ')}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className="text-label text-sm font-semibold py-3 px-4 text-left border-b border-border">{col}</th>
          ))}
          {rowActions && <th className="text-label text-sm font-semibold py-3 px-4 text-left border-b border-border">Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-secondary">
            {columns.map((col, cidx) => (
              <td key={cidx} className="text-body py-3 px-4 border-b border-border">{row[col]}</td>
            ))}
            {rowActions && <td className="py-3 px-4 border-b border-border">{rowActions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
