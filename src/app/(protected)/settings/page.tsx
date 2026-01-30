'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings, Target, BookOpen, Clock, CheckCircle, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountDataManagementSection } from './components/account-data-management-section';
import { ProfileSettingsSection } from './components/profile-settings-section';

interface DailyGoal {
  id: string;
  goal_type: string;
  target_value: number;
  is_active: boolean;
}

interface GoalConfig {
  type: 'words_learned' | 'practice_minutes' | 'reviews_completed';
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  defaultValue: number;
  min: number;
  max: number;
}

const GOAL_CONFIGS: GoalConfig[] = [
  {
    type: 'words_learned',
    label: 'New Words',
    description: 'Learn new vocabulary words each day',
    icon: BookOpen,
    color: 'text-blue-400',
    defaultValue: 5,
    min: 1,
    max: 50,
  },
  {
    type: 'reviews_completed',
    label: 'Reviews',
    description: 'Complete spaced repetition reviews',
    icon: CheckCircle,
    color: 'text-green-400',
    defaultValue: 20,
    min: 5,
    max: 100,
  },
  {
    type: 'practice_minutes',
    label: 'Practice Time',
    description: 'Minutes spent practicing',
    icon: Clock,
    color: 'text-purple-400',
    defaultValue: 10,
    min: 5,
    max: 60,
  },
];

export default function SettingsPage() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, number>>({});
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/daily-goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);

        // Initialize local state from fetched goals
        const values: Record<string, number> = {};
        const active: Record<string, boolean> = {};

        GOAL_CONFIGS.forEach((config) => {
          const existingGoal = data.goals?.find((g: DailyGoal) => g.goal_type === config.type);
          values[config.type] = existingGoal?.target_value || config.defaultValue;
          active[config.type] = existingGoal?.is_active ?? false;
        });

        setLocalValues(values);
        setActiveStates(active);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = async (goalType: string) => {
    setSaving(goalType);
    try {
      const response = await fetch('/api/daily-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalType,
          targetValue: localValues[goalType],
          isActive: activeStates[goalType],
        }),
      });

      if (response.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setSaving(null);
    }
  };

  const toggleGoal = async (goalType: string, isActive: boolean) => {
    setActiveStates((prev) => ({ ...prev, [goalType]: isActive }));

    // Auto-save when toggling
    setSaving(goalType);
    try {
      await fetch('/api/daily-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalType,
          targetValue: localValues[goalType],
          isActive,
        }),
      });
      await fetchGoals();
    } catch (error) {
      console.error('Failed to toggle goal:', error);
      setActiveStates((prev) => ({ ...prev, [goalType]: !isActive }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6" /> Settings
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" /> Settings
      </h1>

      {/* Profile Settings */}
      <ProfileSettingsSection />

      {/* Daily Goals Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Daily Goals
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Set daily learning targets to stay motivated and track your progress.
        </p>

        <div className="space-y-4">
          {GOAL_CONFIGS.map((config) => {
            const Icon = config.icon;
            const isActive = activeStates[config.type] ?? false;
            const value = localValues[config.type] ?? config.defaultValue;
            const existingGoal = goals.find((g) => g.goal_type === config.type);
            const hasChanges = existingGoal
              ? existingGoal.target_value !== value
              : value !== config.defaultValue;

            return (
              <Card
                key={config.type}
                className={cn(
                  'bg-slate-800/50 border-slate-700 p-4 transition-all',
                  isActive && 'border-purple-500/30 bg-slate-800/70'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn('p-2 rounded-lg bg-slate-700/50', config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{config.label}</h3>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{config.description}</p>

                      {isActive && (
                        <div className="mt-3 flex items-center gap-3">
                          <label className="text-sm text-slate-400">Daily target:</label>
                          <Input
                            type="number"
                            min={config.min}
                            max={config.max}
                            value={value}
                            onChange={(e) =>
                              setLocalValues((prev) => ({
                                ...prev,
                                [config.type]: Math.min(
                                  config.max,
                                  Math.max(config.min, parseInt(e.target.value) || config.min)
                                ),
                              }))
                            }
                            className="w-20 h-8 bg-slate-700 border-slate-600 text-white text-center"
                          />
                          <span className="text-sm text-slate-500">
                            {config.type === 'practice_minutes' ? 'min' : 'items'}
                          </span>
                          {hasChanges && (
                            <Button
                              size="sm"
                              onClick={() => saveGoal(config.type)}
                              disabled={saving === config.type}
                              className="bg-purple-600 hover:bg-purple-700 h-8"
                            >
                              {saving === config.type ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => toggleGoal(config.type, checked)}
                    disabled={saving === config.type}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Info Card */}
      <Card className="bg-slate-800/30 border-slate-700/50 p-4 mb-8">
        <p className="text-sm text-slate-400">
          Daily goals reset at midnight. Track your progress on the{' '}
          <a href="/progress" className="text-purple-400 hover:underline">
            Progress page
          </a>
          .
        </p>
      </Card>

      {/* Account & Data Management */}
      <AccountDataManagementSection />
    </div>
  );
}
