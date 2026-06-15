import { Skeleton } from '@/components/ui/skeleton';

export function VocabularyCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-[#1c2024] border border-white/10">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-20 bg-[#272a2e]" />
          <Skeleton className="h-5 w-16 bg-[#272a2e]" />
          <Skeleton className="h-4 w-24 bg-[#272a2e]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full bg-[#272a2e]" />
          <Skeleton className="h-8 w-8 rounded-full bg-[#272a2e]" />
        </div>
      </div>
    </div>
  );
}

export function VocabularyListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <VocabularyCardSkeleton key={i} />
      ))}
    </div>
  );
}

