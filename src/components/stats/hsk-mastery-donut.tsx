'use client';

interface HskMasteryDonutProps {
  masteryRate: number; // 0-100
  hskMasteryByLevel: Record<string, { total: number; learned: number; pct: number }>;
}

const HSK_COLORS: Record<string, string> = {
  hsk1: '#76ffbb',
  hsk2: '#4de8a0',
  hsk3: '#fbbf24',
  hsk4: '#fb923c',
  hsk5: '#f87171',
  hsk6: '#76ffbb80',
};

export function HskMasteryDonut({ masteryRate, hskMasteryByLevel }: HskMasteryDonutProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (masteryRate / 100) * circumference;

  const hskEntries = Object.entries(hskMasteryByLevel)
    .filter(([, v]) => v.total > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col h-full">
      {/* Donut chart */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Background track */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="#272a2e"
              strokeWidth="14"
            />
            {/* Progress arc */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="#76ffbb"
              strokeWidth="14"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#e0e2e8]">{masteryRate}%</span>
            <span className="text-xs text-[#849589]">Mastered</span>
          </div>
        </div>
      </div>

      {/* HSK breakdown */}
      <div className="space-y-2 flex-1">
        {hskEntries.length === 0 ? (
          <p className="text-xs text-[#849589] text-center py-4">No HSK data yet</p>
        ) : (
          hskEntries.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: HSK_COLORS[key] || '#76ffbb' }}
              />
              <span className="text-xs text-[#bacbbe] w-12 flex-shrink-0">
                {key.toUpperCase().replace('HSK', 'HSK ')}
              </span>
              <div className="flex-1 h-1 bg-[#272a2e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${val.pct}%`,
                    backgroundColor: HSK_COLORS[key] || '#76ffbb',
                  }}
                />
              </div>
              <span className="text-xs text-[#849589] w-10 text-right flex-shrink-0">
                {val.pct}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
