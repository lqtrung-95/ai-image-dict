'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FolderPlus, Folder, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
  color: string;
  created_at: string;
  vocabulary_items: { count: number }[];
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });

      if (response.ok) {
        const data = await response.json();
        setCollections((prev) => [{ ...data, vocabulary_items: [{ count: 0 }] }, ...prev]);
        setIsCreateOpen(false);
        setNewName('');
        toast.success('Collection created!');
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));

    try {
      await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      toast.success('Collection deleted');
    } catch {
      fetchCollections();
      toast.error('Failed to delete collection');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Collections</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-24 bg-slate-800/50 border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Collections</h1>
          <p className="text-slate-400">{collections.length} collections</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <FolderPlus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Food, Animals, Travel"
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-200">Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newColor === color ? 'scale-110 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {creating ? 'Creating...' : 'Create Collection'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Folder className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No collections yet</h2>
          <p className="text-slate-400 mb-6">
            Create collections to organize your vocabulary
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Create Your First Collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="group p-4 bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${collection.color}20` }}
                  >
                    <Folder className="w-5 h-5" style={{ color: collection.color }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{collection.name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {collection.vocabulary_items?.[0]?.count || 0} words
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(collection.id)}
                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

