/** Grey shimmering shapes shown while a page loads, in the layout it will have. */

export const PosterSkeleton = ({ className = 'w-36 sm:w-44' }: { className?: string }) => (
    <div className={`shrink-0 ${className}`}>
        <div className="skeleton aspect-[2/3] w-full" />
        <div className="skeleton mt-3 h-3 w-4/5" />
        <div className="skeleton mt-2 h-3 w-1/2" />
    </div>
);

export const RowSkeleton = ({ count = 7 }: { count?: number }) => (
    <div className="mb-10">
        <div className="skeleton mx-4 sm:mx-8 mb-4 h-6 w-56" />
        <div className="flex gap-4 overflow-hidden px-4 sm:px-8">
            {Array.from({ length: count }, (_, i) => <PosterSkeleton key={i} />)}
        </div>
    </div>
);

export const HeroSkeleton = () => (
    <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <div className="skeleton absolute inset-0 rounded-none opacity-60" />
        <div className="absolute bottom-16 left-4 sm:left-8 space-y-4 w-2/3 max-w-xl">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="flex gap-3 pt-2">
                <div className="skeleton h-11 w-36 rounded-full" />
                <div className="skeleton h-11 w-36 rounded-full" />
            </div>
        </div>
    </div>
);

export const GridSkeleton = ({ count = 12 }: { count?: number }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {Array.from({ length: count }, (_, i) => <PosterSkeleton key={i} className="w-full" />)}
    </div>
);
