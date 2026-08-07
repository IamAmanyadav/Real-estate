export default function PropertyDetailLoading() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          {/* Back button */}
          <div className="h-6 bg-muted rounded w-32" />

          {/* Image gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-3 aspect-[16/9] bg-muted rounded-2xl" />
            <div className="hidden lg:flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-muted rounded-xl" />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-muted rounded-full" />
                <div className="h-6 w-24 bg-muted rounded-full" />
              </div>
              {/* Title */}
              <div className="h-8 bg-muted rounded w-3/4" />
              {/* Address */}
              <div className="h-5 bg-muted rounded w-1/2" />
              {/* Price */}
              <div className="h-10 bg-muted rounded w-40" />

              {/* Key details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl" />
                ))}
              </div>

              {/* Description */}
              <div className="space-y-3 pt-4">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>

              {/* Features */}
              <div className="space-y-3 pt-4">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-5 bg-muted rounded w-3/4" />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="h-64 bg-muted rounded-2xl" />
              <div className="h-80 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
