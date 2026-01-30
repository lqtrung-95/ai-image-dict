'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Check, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface Photo {
  id: string;
  image_url: string;
  scene_context?: { description?: string };
}

export default function NewStoryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('photo_analyses')
      .select('id, image_url, scene_context')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load photos');
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  const togglePhoto = (id: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (selectedPhotos.size === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          photoIds: Array.from(selectedPhotos),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Story created!');
        router.push(`/stories/${data.story.id}`);
      } else {
        throw new Error('Failed to create story');
      }
    } catch (error) {
      toast.error('Failed to create story');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse mb-6" />
        <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link href="/stories">
        <Button variant="ghost" className="mb-4 -ml-2 text-slate-400">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Stories
        </Button>
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Create Photo Story</h1>

      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Story Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Kitchen, At the Park..."
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this story is about..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Select Photos
          <span className="ml-2 text-sm text-slate-400">({selectedPhotos.size} selected)</span>
        </h2>
      </div>

      {photos.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No photos yet. Capture some photos first!</p>
          <Link href="/capture">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">Capture Photo</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => togglePhoto(photo.id)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedPhotos.has(photo.id)
                    ? 'border-purple-500 ring-2 ring-purple-500/30'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <img
                  src={photo.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {selectedPhotos.has(photo.id) && (
                  <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={creating || !title.trim() || selectedPhotos.size === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creating ? 'Creating...' : 'Create Story'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
