export default function DestinationDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-4 w-36 bg-gray-200 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-9 w-3/4 bg-gray-200 rounded-lg mb-4" />
            <div className="flex gap-2">
              <div className="h-7 w-20 bg-gray-100 rounded-full" />
              <div className="h-7 w-20 bg-gray-100 rounded-full" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
            <div className="h-4 w-4/6 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
            <div className="flex gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-9 h-9 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-72" />
        </div>
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
            <div className="h-12 w-full bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
