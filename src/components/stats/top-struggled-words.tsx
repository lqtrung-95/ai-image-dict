'use client';

interface StruggledWord {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  hskLevel?: number | null;
  accuracy: number;
  attempts: number;
}

interface TopStruggledWordsProps {
  words: StruggledWord[];
}

export function TopStruggledWords({ words }: TopStruggledWordsProps) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="material-symbols-outlined text-3xl text-[#849589] mb-2">emoji_events</span>
        <p className="text-sm text-[#bacbbe]">No struggling words yet.</p>
        <p className="text-xs text-[#849589] mt-1">Practice more to see your weak spots.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {words.map((word) => (
        <div key={word.id} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1c2024] border border-white/5 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#e0e2e8]">{word.wordZh}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-[#e0e2e8] truncate">{word.wordEn}</span>
              {word.hskLevel && (
                <span className="text-xs text-[#849589] bg-[#272a2e] px-1.5 py-0.5 rounded flex-shrink-0">
                  HSK {word.hskLevel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-[#272a2e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${word.accuracy}%`,
                    backgroundColor: word.accuracy < 40 ? '#f87171' : word.accuracy < 70 ? '#fb923c' : '#76ffbb',
                  }}
                />
              </div>
              <span
                className="text-xs font-mono flex-shrink-0"
                style={{ color: word.accuracy < 40 ? '#f87171' : word.accuracy < 70 ? '#fb923c' : '#76ffbb' }}
              >
                {word.accuracy}%
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#849589]">{word.attempts} tries</p>
          </div>
        </div>
      ))}
    </div>
  );
}
