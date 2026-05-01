export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div>
          <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="h-5 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-100 rounded" />
            <div className="flex gap-3">
              <div className="h-8 w-20 bg-gray-100 rounded-lg" />
              <div className="h-8 w-20 bg-gray-100 rounded-lg" />
              <div className="h-8 w-20 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
