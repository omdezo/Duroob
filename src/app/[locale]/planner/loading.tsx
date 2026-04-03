export default function PlannerLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-8 w-56 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-80 bg-gray-100 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 flex-1 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
            <div className="h-12 w-full bg-gray-200 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-4" />
            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
