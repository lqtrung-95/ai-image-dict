'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { List, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVocabularyLists } from '@/hooks/use-vocabulary-lists';
import { VocabularyListCard } from '@/components/lists/vocabulary-list-card';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export default function ListsPage() {
  const { lists, loading, createList, deleteList } = useVocabularyLists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    const result = await createList({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      color: newColor,
      isPublic,
    });

    if (result) {
      setIsCreateOpen(false);
      setNewName('');
      setNewDescription('');
      setNewColor('#6366f1');
      setIsPublic(false);
      toast.success('List created!');
    } else {
      toast.error('Failed to create list');
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteList(id);
    if (success) {
      toast.success('List deleted');
    } else {
      toast.error('Failed to delete list');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">My Lists</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 bg-slate-800/50 border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Lists</h1>
          <p className="text-slate-400">{lists.length} vocabulary lists</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Vocabulary List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., HSK 3 Words, Travel Phrases"
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-slate-200">Description (optional)</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is this list for?"
                  className="bg-slate-700/50 border-slate-600 text-white mt-1 resize-none"
                  rows={2}
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
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200">Make Public</Label>
                  <p className="text-xs text-slate-400">Others can view this list</p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create List'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <List className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No lists yet</h2>
          <p className="text-slate-400 mb-6">
            Create lists to organize your vocabulary with many-to-many grouping
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <VocabularyListCard
              key={list.id}
              list={list}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
