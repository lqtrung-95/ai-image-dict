'use client';

interface MonthData {
  month: string; // YYYY-MM
  count: number;
}

interface VocabularyLineChartProps {
  wordsPerMonth: MonthData[];
}

export function VocabularyLineChart({ wordsPerMonth }: VocabularyLineChartProps) {
  const width = 600;
  const height = 120;
  const paddingX = 8;
  const paddingY = 12;

  if (!wordsPerMonth || wordsPerMonth.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-[#849589] text-sm">
        No data yet
      </div>
    );
  }

  // Build cumulative totals
  let cumulative = 0;
  const data = wordsPerMonth.map(d => {
    cumulative += d.count;
    return { ...d, cumulative };
  });

  const maxVal = Math.max(...data.map(d => d.cumulative), 1);
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (width - paddingX * 2);
    const y = paddingY + (1 - d.cumulative / maxVal) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Area fill path
  const areaPath = points.length > 0
    ? `M${points[0].x},${height} ` +
      points.map(p => `L${p.x},${p.y}`).join(' ') +
      ` L${points[points.length - 1].x},${height} Z`
    : '';

  // Month labels — show every 3rd month
  const labelIndices = data.map((_, i) => i).filter(i => i % 3 === 0 || i === data.length - 1);

  const formatMonth = (month: string) => {
    const [, m] = month.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m) - 1];
  };

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: 140 }}
      >
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#76ffbb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#76ffbb" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#lineAreaGrad)" />
        )}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#76ffbb"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill="#76ffbb"
          />
        )}

        {/* Month labels */}
        {labelIndices.map(i => (
          <text
            key={i}
            x={points[i].x}
            y={height + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#849589"
          >
            {formatMonth(data[i].month)}
          </text>
        ))}
      </svg>

      {/* Max label */}
      <div className="flex justify-between text-xs text-[#849589] -mt-1">
        <span>{data[0]?.cumulative ?? 0} words</span>
        <span>{data[data.length - 1]?.cumulative ?? 0} total</span>
      </div>
    </div>
  );
}
