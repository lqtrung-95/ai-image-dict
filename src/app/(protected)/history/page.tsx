'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Trash2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Analysis {
  id: string;
  image_url: string;
  scene_context: {
    description?: string;
  };
  created_at: string;
  detected_objects: Array<{ id: string }>;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyses = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('*, detected_objects(id)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch analyses:', error);
      } else {
        setAnalyses(data || []);
      }
      setLoading(false);
    };

    fetchAnalyses();
  }, []);

  const handleDelete = async (id: string) => {
    const supabase = createClient();

    // Optimistic update
    setAnalyses((prev) => prev.filter((a) => a.id !== id));

    const { error } = await supabase.from('photo_analyses').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete analysis:', error);
      toast.error('Failed to delete');
      // Refetch on error
      const { data } = await supabase
        .from('photo_analyses')
        .select('*, detected_objects(id)')
        .order('created_at', { ascending: false });
      setAnalyses(data || []);
    } else {
      toast.success('Analysis deleted');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <h1 className="text-2xl font-bold text-white mb-6">History</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <Skeleton className="aspect-video bg-slate-700" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <Skeleton className="h-3 w-1/2 bg-slate-700" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-slate-400">{analyses.length} analyses</p>
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <History className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No history yet</h2>
          <p className="text-slate-400 mb-6">
            Your analyzed photos will appear here
          </p>
          <Link href="/capture">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Capture Your First Photo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="group bg-slate-800/50 border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors"
            >
              {/* Use native img for better Safari compatibility */}
              <div className="relative aspect-video bg-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={analysis.image_url}
                  alt="Analysis"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Desktop: show on hover */}
                <div className="hidden md:flex absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Link href={`/analysis/${analysis.id}`}>
                    <Button size="sm" className="bg-white/90 text-slate-900 hover:bg-white">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(analysis.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-white font-medium truncate">
                  {analysis.scene_context?.description || 'Photo analysis'}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-slate-400">
                    {formatDate(analysis.created_at)}
                  </span>
                  <span className="text-sm text-purple-400">
                    {analysis.detected_objects?.length || 0} words
                  </span>
                </div>
                {/* Mobile: always visible action buttons */}
                <div className="flex md:hidden items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                  <Link href={`/analysis/${analysis.id}`} className="flex-1">
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDelete(analysis.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

