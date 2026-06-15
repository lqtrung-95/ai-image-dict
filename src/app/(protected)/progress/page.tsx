'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { ActivityHeatmap } from '@/components/dashboard/activity-heatmap';
import { HskMasteryDonut } from '@/components/stats/hsk-mastery-donut';
import { VocabularyLineChart } from '@/components/stats/vocabulary-line-chart';
import { TopStruggledWords } from '@/components/stats/top-struggled-words';
import { UpcomingMilestones } from '@/components/stats/upcoming-milestones';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  learnedWords: number;
  totalPracticeSessions: number;
  totalPracticeHours: number;
  srsAccuracy: number;
  dueToday: number;
  masteredThisWeek: number;
  hskMasteryByLevel: Record<string, { total: number; learned: number; pct: number }>;
  wordsPerMonth: { month: string; count: number }[];
}

interface StruggledWord {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  hskLevel?: number | null;
  accuracy: number;
  attempts: number;
}

interface Milestone {
  label: string;
  current: number;
  target: number;
  pct: number;
  done: boolean;
}

export default function ProgressPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activityData, setActivityData] = useState<{ date: string; wordsReviewed: number }[]>([]);
  const [struggledWords, setStruggledWords] = useState<StruggledWord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes, struggledRes, milestonesRes] = await Promise.all([
        apiFetch('/api/stats'),
        apiFetch('/api/stats/activity?days=84'),
        apiFetch('/api/stats/struggled-words'),
        apiFetch('/api/stats/milestones'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      setStats(await statsRes.json());

      if (activityRes.ok) {
        const d = await activityRes.json();
        setActivityData(d.activity || []);
      }
      if (struggledRes.ok) {
        const d = await struggledRes.json();
        setStruggledWords(d.words || []);
      }
      if (milestonesRes.ok) {
        const d = await milestonesRes.json();
        setMilestones(d.milestones || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="h-8 w-48 bg-[#1c2024] rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#1c2024] rounded-xl animate-pulse" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="h-48 bg-[#1c2024] rounded-xl animate-pulse" />
          <div className="h-48 bg-[#1c2024] rounded-xl animate-pulse" />
        </div>
        <div className="h-48 bg-[#1c2024] rounded-xl animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-48 bg-[#1c2024] rounded-xl animate-pulse" />
          <div className="h-48 bg-[#1c2024] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchAll} variant="outline" className="border-white/10 text-[#e0e2e8]">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!stats || stats.totalWords === 0) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight mb-6">Learning Statistics</h1>
        <div className="text-center py-20 bg-[#181c20] border border-white/5 rounded-2xl">
          <span className="material-symbols-outlined text-5xl text-[#849589] mb-4 block">trending_up</span>
          <h2 className="text-xl font-semibold text-[#e0e2e8] mb-2">No stats yet</h2>
          <p className="text-[#bacbbe] mb-6">Capture your first photo to start tracking progress.</p>
          <Button onClick={() => router.push('/capture')} className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90">
            <Play className="w-4 h-4 mr-2" /> Capture Photo
          </Button>
        </div>
      </div>
    );
  }

  const masteryRate = stats.totalWords > 0
    ? Math.round((stats.learnedWords / stats.totalWords) * 100)
    : 0;

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">Learning Statistics</h1>
          <p className="text-[#bacbbe] mt-1 text-sm">Your Mandarin learning journey at a glance</p>
        </div>
        {stats.dueToday > 0 && (
          <Button
            onClick={() => router.push('/practice')}
            className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90 gap-2"
          >
            <Play className="w-4 h-4" />
            Practice Now · {stats.dueToday} due
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="history_edu" label="Characters" value={stats.totalWords} unit="" />
        <StatCard icon="local_fire_department" label="Day Streak" value={stats.currentStreak} unit="Days" />
        <StatCard icon="schedule" label="Practice Time" value={stats.totalPracticeHours} unit="Hours" />
        <StatCard icon="target" label="SRS Accuracy" value={stats.srsAccuracy} unit="%" />
      </div>

      {/* Heatmap + HSK Mastery donut */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* ActivityHeatmap renders its own Card — no outer wrapper to avoid double-card */}
        <div className="md:col-span-2">
          {activityData.length > 0
            ? <ActivityHeatmap activity={activityData} className="h-full" />
            : (
              <div className="bg-[#181c20] border border-white/5 rounded-xl p-6 h-full flex items-center justify-center">
                <p className="text-[#849589] text-sm">No activity data yet</p>
              </div>
            )
          }
        </div>

        <div className="bg-[#181c20] border border-white/5 rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#e0e2e8] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76ffbb]" style={{ fontSize: 18 }}>donut_large</span>
            HSK Mastery
          </h2>
          <HskMasteryDonut
            masteryRate={masteryRate}
            hskMasteryByLevel={stats.hskMasteryByLevel}
          />
        </div>
      </div>

      {/* Vocabulary Expansion line chart */}
      <div className="bg-[#181c20] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#e0e2e8] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76ffbb]" style={{ fontSize: 18 }}>trending_up</span>
            Vocabulary Expansion (12 Mo)
          </h2>
          <span className="text-sm text-[#76ffbb] font-semibold">+{stats.masteredThisWeek} this week</span>
        </div>
        <VocabularyLineChart wordsPerMonth={stats.wordsPerMonth} />
      </div>

      {/* Struggled words + Milestones */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#181c20] border border-white/5 rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#e0e2e8] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76ffbb]" style={{ fontSize: 18 }}>psychology_alt</span>
            Top Struggled Words
          </h2>
          <TopStruggledWords words={struggledWords} />
        </div>

        <div className="bg-[#181c20] border border-white/5 rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#e0e2e8] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76ffbb]" style={{ fontSize: 18 }}>emoji_events</span>
            Upcoming Milestones
          </h2>
          <UpcomingMilestones milestones={milestones} />
        </div>
      </div>

      {/* Streak motivational footer */}
      {stats.currentStreak > 0 && (
        <div className="text-center p-6 rounded-xl bg-[#181c20] border border-[#76ffbb]/20">
          <p className="text-2xl mb-2">
            {stats.currentStreak >= 30 ? '🏆' : stats.currentStreak >= 7 ? '🎉' : '🔥'}
          </p>
          <p className="text-lg text-[#e0e2e8] font-medium">
            {stats.currentStreak === 1
              ? 'Great start! Keep practicing tomorrow!'
              : stats.currentStreak < 7
                ? `${stats.currentStreak} day streak! You're building momentum!`
                : stats.currentStreak < 30
                  ? `${stats.currentStreak} days! You're on fire!`
                  : `${stats.currentStreak} days! You're a dedication champion!`}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: string; label: string; value: number; unit: string }) {
  return (
    <div className="bg-[#181c20] border border-white/5 rounded-xl p-5 ghost-border jade-glow">
      <div className="flex items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-[#76ffbb] p-2 bg-[#76ffbb]/10 rounded-lg" style={{ fontSize: 20 }}>
          {icon}
        </span>
        <h4 className="text-sm font-medium text-[#e0e2e8]">{label}</h4>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#e0e2e8]">{value}</span>
        {unit && <span className="text-sm text-[#bacbbe]">{unit}</span>}
      </div>
    </div>
  );
}
