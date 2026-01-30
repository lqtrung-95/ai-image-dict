'use client';

import { Card } from '@/components/ui/card';

interface ActivityHeatmapProps {
  activity: { date: string; wordsReviewed: number }[];
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  // Get max for color scaling
  const maxReviews = Math.max(...activity.map((a) => a.wordsReviewed), 1);

  // Group by weeks (7 days per column)
  const weeks: { date: string; wordsReviewed: number }[][] = [];
  let currentWeek: { date: string; wordsReviewed: number }[] = [];

  // Pad the beginning to align with day of week
  const firstDate = activity[0]?.date;
  if (firstDate) {
    const dayOfWeek = new Date(firstDate).getDay();
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: '', wordsReviewed: -1 });
    }
  }

  activity.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColorClass = (count: number): string => {
    if (count < 0) return 'bg-transparent';
    if (count === 0) return 'bg-slate-700';
    const intensity = count / maxReviews;
    if (intensity < 0.25) return 'bg-green-900';
    if (intensity < 0.5) return 'bg-green-700';
    if (intensity < 0.75) return 'bg-green-500';
    return 'bg-green-400';
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totalReviews = activity.reduce((sum, a) => sum + a.wordsReviewed, 0);

  return (
    <Card className="p-4 bg-slate-800/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-white">Activity</h3>
        <span className="text-sm text-slate-400">
          {totalReviews} reviews in {activity.length} days
        </span>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {days.map((day, i) => (
            <div key={day} className="h-3 text-[10px] text-slate-500 flex items-center">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getColorClass(day.wordsReviewed)}`}
                  title={day.date ? `${day.date}: ${day.wordsReviewed} reviews` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-700" />
          <div className="w-3 h-3 rounded-sm bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
        </div>
        <span>More</span>
      </div>
    </Card>
  );
}
