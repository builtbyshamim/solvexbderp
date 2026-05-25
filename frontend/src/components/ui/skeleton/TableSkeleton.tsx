// --- Sub-components for better scaling ---

 export const TableSkeleton = () => (
  <div className="p-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl w-full"></div>
      ))}
    </div>
  </div>
);