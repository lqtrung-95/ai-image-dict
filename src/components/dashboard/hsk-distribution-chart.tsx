'use client';

import { Card } from '@/components/ui/card';

interface HskDistributionChartProps {
  distribution: { level: number; count: number }[];
}

const HSK_COLORS = [
  'bg-green-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
];

export function HskDistributionChart({ distribution }: HskDistributionChartProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  // Fill in missing levels
  const fullDistribution = [1, 2, 3, 4, 5, 6].map((level) => {
    const found = distribution.find((d) => d.level === level);
    return { level, count: found?.count || 0 };
  });

  const totalWords = fullDistribution.reduce((sum, d) => sum + d.count, 0);

  if (totalWords === 0) {
    return (
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <h3 className="font-medium text-white mb-3">HSK Distribution</h3>
        <p className="text-slate-400 text-sm">No HSK-tagged words yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-slate-800/50 border-slate-700">
      <h3 className="font-medium text-white mb-4">HSK Distribution</h3>

      <div className="space-y-3">
        {fullDistribution.map((item) => {
          const percent = (item.count / maxCount) * 100;
          const color = HSK_COLORS[item.level - 1];

          return (
            <div key={item.level} className="flex items-center gap-3">
              <span className="text-sm text-slate-400 w-12">HSK {item.level}</span>
              <div className="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                <div
                  className={`h-full ${color} transition-all flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(percent, item.count > 0 ? 10 : 0)}%` }}
                >
                  {item.count > 0 && (
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
