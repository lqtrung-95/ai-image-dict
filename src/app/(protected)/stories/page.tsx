'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  photoCount: number;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStories((prev) => prev.filter((s) => s.id !== id));
        toast.success('Story deleted');
      }
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Photo Stories</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Photo Stories</h1>
          <p className="text-slate-400">Create stories from your photos to organize vocabulary by context</p>
        </div>
        <Link href="/stories/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </Button>
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No stories yet</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create photo stories to organize your vocabulary by context. For example: &ldquo;My Kitchen&rdquo;,
            &ldquo;At the Park&rdquo;, or &ldquo;Restaurant Visit&rdquo;.
          </p>
          <Link href="/stories/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Story
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors group"
            >
              <Link href={`/stories/${story.id}`}>
                <div className="aspect-video bg-slate-700 relative overflow-hidden cursor-pointer">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                    {story.photoCount} photos
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/stories/${story.id}`}>
                      <h3 className="font-semibold text-white mb-1 cursor-pointer hover:text-purple-400 transition-colors">
                        {story.title}
                      </h3>
                    </Link>
                    {story.description && (
                      <p className="text-sm text-slate-400 line-clamp-2">{story.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(story.id);
                    }}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 -mr-2 -mt-2"
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
