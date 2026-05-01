export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-4 w-96 bg-gray-100 rounded mb-8" />

      {/* Region chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-20 bg-gray-100 rounded-full" />
        ))}
      </div>

      {/* Trip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/3 bg-gray-100 rounded" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-gray-100 rounded-md" />
              <div className="h-5 w-16 bg-gray-100 rounded-md" />
            </div>
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
