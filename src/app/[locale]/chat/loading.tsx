export default function ChatLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-8" />
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-4" />
        <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-60 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
