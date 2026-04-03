export default function DestinationsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-36 bg-gray-100 rounded mb-8" />
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-9 w-full bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </aside>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
    </div>
  );
}
