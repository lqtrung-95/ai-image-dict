'use client';

import { Card } from '@/components/ui/card';

interface ActivityHeatmapProps {
  activity: { date: string; wordsReviewed: number }[];
  className?: string;
}

export function ActivityHeatmap({ activity, className }: ActivityHeatmapProps) {
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
    if (count === 0) return 'bg-[#1c2024]';
    const intensity = count / maxReviews;
    if (intensity < 0.25) return 'bg-[#76ffbb]/20';
    if (intensity < 0.5) return 'bg-[#76ffbb]/40';
    if (intensity < 0.75) return 'bg-[#76ffbb]/70';
    return 'bg-[#76ffbb]';
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totalReviews = activity.reduce((sum, a) => sum + a.wordsReviewed, 0);

  return (
    <Card className={`p-6 bg-[#181c20] border-white/5 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#e0e2e8]">Activity</h3>
        <span className="text-sm text-[#bacbbe]">
          {totalReviews} reviews in {activity.length} days
        </span>
      </div>

      <div className="flex gap-1 w-full">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 flex-shrink-0">
          {days.map((day, i) => (
            <div key={day} className="h-3 text-[10px] text-[#849589] flex items-center">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid — flex-1 so weeks stretch to fill container width */}
        <div className="flex gap-1 flex-1 min-w-0">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1 flex-1 min-w-0">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`h-3 rounded-sm w-full ${getColorClass(day.wordsReviewed)}`}
                  title={day.date ? `${day.date}: ${day.wordsReviewed} reviews` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-[#849589]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#1c2024]" />
          <div className="w-3 h-3 rounded-sm bg-[#76ffbb]/20" />
          <div className="w-3 h-3 rounded-sm bg-[#76ffbb]/40" />
          <div className="w-3 h-3 rounded-sm bg-[#76ffbb]/70" />
          <div className="w-3 h-3 rounded-sm bg-[#76ffbb]" />
        </div>
        <span>More</span>
      </div>
    </Card>
  );
}
