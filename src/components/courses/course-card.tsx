'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Star, ChevronRight } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    description?: string;
    difficultyLevel: number;
    subscriberCount: number;
    ratingAvg: number | null;
    ratingCount: number;
    wordCount: number;
    creatorName?: string;
    isSubscribed?: boolean;
  };
}

const HSK_COLORS = [
  'bg-green-500/20 text-green-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-orange-500/20 text-orange-400',
  'bg-red-500/20 text-red-400',
];

export function CourseCard({ course }: CourseCardProps) {
  const hskColor = HSK_COLORS[course.difficultyLevel - 1] || HSK_COLORS[0];

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors overflow-hidden">
      <Link href={`/courses/${course.id}`} className="block p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{course.name}</h3>
            {course.creatorName && (
              <p className="text-sm text-slate-500">by {course.creatorName}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${hskColor} flex-shrink-0 ml-2`}>
            HSK {course.difficultyLevel}
          </span>
        </div>

        {course.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{course.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {course.wordCount} words
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {course.subscriberCount}
          </span>
          {course.ratingAvg !== null && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {course.ratingAvg.toFixed(1)}
              <span className="text-slate-500">({course.ratingCount})</span>
            </span>
          )}
        </div>

        {course.isSubscribed && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
              Subscribed
            </span>
          </div>
        )}
      </Link>
    </Card>
  );
}
