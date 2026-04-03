export default function SavedLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-36 bg-gray-100 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-36 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
