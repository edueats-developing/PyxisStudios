export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <div className="animate-pulse">
        {/* Back button placeholder */}
        <div className="w-24 h-10 bg-gray-200 rounded mb-4"></div>
        
        {/* Restaurant name placeholder */}
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        
        {/* Description placeholder */}
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        
        {/* Search bar placeholder */}
        <div className="h-12 bg-gray-200 rounded w-full mb-8"></div>
        
        {/* Menu items grid placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border p-4 rounded shadow-md">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-40 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
