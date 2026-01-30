'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, BookOpen, ChevronRight, Trash2, Globe, Lock } from 'lucide-react';
import { VocabularyList } from '@/types';

interface VocabularyListCardProps {
  list: VocabularyList;
  onDelete?: (id: string) => void;
}

export function VocabularyListCard({ list, onDelete }: VocabularyListCardProps) {
  const progressPercent = list.wordCount && list.wordCount > 0
    ? Math.round(((list.learnedCount || 0) / list.wordCount) * 100)
    : 0;

  return (
    <Card className="group bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors overflow-hidden">
      <Link href={`/lists/${list.id}`} className="block p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${list.color}20` }}
          >
            <List className="w-5 h-5" style={{ color: list.color }} />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white truncate">{list.name}</h3>
              {list.isPublic ? (
                <span title="Public"><Globe className="w-3 h-3 text-green-400 flex-shrink-0" /></span>
              ) : (
                <span title="Private"><Lock className="w-3 h-3 text-slate-500 flex-shrink-0" /></span>
              )}
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {list.wordCount || 0} words
              {(list.wordCount || 0) > 0 && (
                <span className="text-purple-400 ml-1">({progressPercent}% learned)</span>
              )}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </div>

        {/* Progress bar */}
        {(list.wordCount || 0) > 0 && (
          <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: list.color,
              }}
            />
          </div>
        )}
      </Link>

      {onDelete && (
        <div className="px-4 pb-3 pt-0 flex justify-end border-t border-slate-700/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onDelete(list.id);
            }}
            className="h-8 text-slate-400 hover:text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </Card>
  );
}
