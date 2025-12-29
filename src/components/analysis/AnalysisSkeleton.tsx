import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-video rounded-xl bg-slate-700" />

      {/* Scene description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-slate-700" />
        <Skeleton className="h-6 w-full bg-slate-700" />
      </div>

      {/* Vocabulary cards skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 bg-slate-700" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <Skeleton className="h-10 w-16 mb-2 bg-slate-700" />
              <Skeleton className="h-4 w-12 mb-1 bg-slate-700" />
              <Skeleton className="h-3 w-20 bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyzingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-purple-500/20 animate-pulse" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Analyzing your photo...</h3>
      <p className="text-slate-400 max-w-sm">
        Our AI is detecting objects and translating them to Chinese. This usually takes a few seconds.
      </p>
    </div>
  );
}

