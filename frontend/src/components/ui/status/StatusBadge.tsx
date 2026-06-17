export const StatusBadge = ({ isActive }:any) => {
  const statusConfig = isActive
    ? {
        label: 'Active',
        container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      }
    : {
        label: 'Inactive',
        container: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 
        rounded-full border text-xs font-medium 
        ${statusConfig.container} transition-all duration-300
      `}
    >
      {/* Small pulsing dot for active status */}
      <span className={`relative flex h-2 w-2`}>
        {isActive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dot}`}></span>
      </span>
      {statusConfig.label}
    </div>
  );
};

export default StatusBadge;