'use client';

interface Milestone {
  label: string;
  current: number;
  target: number;
  pct: number;
  done: boolean;
}

interface UpcomingMilestonesProps {
  milestones: Milestone[];
}

export function UpcomingMilestones({ milestones }: UpcomingMilestonesProps) {
  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="material-symbols-outlined text-3xl text-[#76ffbb] mb-2">trophy</span>
        <p className="text-sm text-[#bacbbe]">All milestones completed!</p>
        <p className="text-xs text-[#849589] mt-1">You&apos;re a true master.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((m) => (
        <div key={m.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[#e0e2e8]">{m.label}</span>
            <span className="text-xs text-[#849589]">
              {m.current} / {m.target}
            </span>
          </div>
          <div className="h-1.5 bg-[#272a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#76ffbb] rounded-full transition-all duration-500"
              style={{ width: `${m.pct}%` }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-[#76ffbb]">{m.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
