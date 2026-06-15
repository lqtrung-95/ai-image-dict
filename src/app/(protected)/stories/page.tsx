'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

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
      const response = await apiFetch('/api/stories');
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
      const response = await apiFetch(`/api/stories/${id}`, { method: 'DELETE' });
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
            <div key={i} className="h-64 bg-[#1c2024] rounded-xl animate-pulse" />
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
          <p className="text-[#bacbbe]">Create stories from your photos to organize vocabulary by context</p>
        </div>
        <Link href="/stories/new">
          <Button className="bg-[#76ffbb] hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </Button>
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1c2024] flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#849589]" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No stories yet</h2>
          <p className="text-[#bacbbe] mb-6 max-w-md mx-auto">
            Create photo stories to organize your vocabulary by context. For example: &ldquo;My Kitchen&rdquo;,
            &ldquo;At the Park&rdquo;, or &ldquo;Restaurant Visit&rdquo;.
          </p>
          <Link href="/stories/new">
            <Button className="bg-[#76ffbb] hover:opacity-90">
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
              className="bg-[#1c2024] border-white/10 overflow-hidden hover:border-[#76ffbb]/50 transition-colors group"
            >
              <Link href={`/stories/${story.id}`}>
                <div className="aspect-video bg-[#272a2e] relative overflow-hidden cursor-pointer">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-[#849589]" />
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
                      <h3 className="font-semibold text-white mb-1 cursor-pointer hover:text-[#76ffbb] transition-colors">
                        {story.title}
                      </h3>
                    </Link>
                    {story.description && (
                      <p className="text-sm text-[#bacbbe] line-clamp-2">{story.description}</p>
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
                    className="text-[#849589] hover:text-red-400 hover:bg-red-500/10 -mr-2 -mt-2"
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
