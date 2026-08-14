export default function PropertiesLoading() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-80 h-[600px] bg-muted rounded-2xl" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-2xl aspect-[3/4]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
