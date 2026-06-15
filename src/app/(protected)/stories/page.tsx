'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex items-end justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">Photo Stories</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-[#181c20] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">Photo Stories</h1>
          <p className="text-[#bacbbe] mt-1 text-sm">Organize vocabulary by context and location</p>
        </div>
        <Link href="/stories/new">
          <Button className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90 gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Create Story
          </Button>
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-[#181c20] border border-white/5 rounded-2xl">
          <span className="material-symbols-outlined text-5xl text-[#849589] mb-4">auto_stories</span>
          <h2 className="text-lg font-semibold text-[#e0e2e8] mb-2">No stories yet</h2>
          <p className="text-sm text-[#bacbbe] mb-6 max-w-sm">
            Create photo stories to organize your vocabulary by context — &ldquo;My Kitchen&rdquo;, &ldquo;At the Park&rdquo;, or &ldquo;Restaurant Visit&rdquo;.
          </p>
          <Link href="/stories/new">
            <Button className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90 gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Create Your First Story
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-[#181c20] border border-white/5 rounded-xl overflow-hidden hover:border-[#76ffbb]/30 transition-all jade-glow group ghost-border"
            >
              <Link href={`/stories/${story.id}`}>
                <div className="aspect-video bg-[#1c2024] relative overflow-hidden cursor-pointer">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-[#849589]">image</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-[#e0e2e8] flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>photo_library</span>
                    {story.photoCount}
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/stories/${story.id}`}>
                      <h3 className="font-semibold text-[#e0e2e8] mb-1 cursor-pointer hover:text-[#76ffbb] transition-colors truncate">
                        {story.title}
                      </h3>
                    </Link>
                    {story.description && (
                      <p className="text-sm text-[#bacbbe] line-clamp-2">{story.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(story.id);
                    }}
                    className="p-1.5 rounded-lg text-[#849589] hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
