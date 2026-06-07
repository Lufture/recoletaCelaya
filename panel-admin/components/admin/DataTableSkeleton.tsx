interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
}

export default function DataTableSkeleton({
  columns = 5,
  rows = 8,
}: DataTableSkeletonProps) {
  return (
    <div className="card overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <div className="skeleton h-9 w-64 rounded-lg" />
        <div className="skeleton h-9 w-32 rounded-lg ml-auto" />
      </div>

      {/* Table header */}
      <div className="grid gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--rc-slate-50)]"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => {
  // Esto generará anchos diferentes para cada barra (ej: 65%, 70%, 75%...), 
  // pero el servidor y el cliente calcularán exactamente el mismo valor.
  const widthPercentage = 60 + ((i * 7) % 30); 
  
  return (
    <div 
      key={i} 
      className="skeleton h-4 rounded" 
      style={{ width: `${widthPercentage}%` }} 
    />
  );
})}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="skeleton h-4 rounded"
              style={{
                width: `${50 + Math.random() * 40}%`,
                animationDelay: `${(rowIdx * columns + colIdx) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
