'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateCoursePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('1');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Course name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          difficultyLevel: parseInt(difficultyLevel),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create course');
      }

      const course = await response.json();
      toast.success('Course created! Now add some vocabulary.');
      router.push(`/courses/${course.id}/edit`);
    } catch (error) {
      console.error('Create course error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link
        href="/courses"
        className="inline-flex items-center text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Courses
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Course</h1>
          <p className="text-slate-400">Share your vocabulary collection with the community</p>
        </div>
      </div>

      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-slate-200">Course Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Essential HSK 3 Vocabulary"
              className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              maxLength={150}
              disabled={creating}
            />
          </div>

          <div>
            <Label className="text-slate-200">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will learners gain from this course?"
              className="mt-1 bg-slate-700/50 border-slate-600 text-white resize-none"
              rows={3}
              disabled={creating}
            />
          </div>

          <div>
            <Label className="text-slate-200">Difficulty Level</Label>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel} disabled={creating}>
              <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="1" className="text-slate-300">HSK 1 - Beginner</SelectItem>
                <SelectItem value="2" className="text-slate-300">HSK 2 - Elementary</SelectItem>
                <SelectItem value="3" className="text-slate-300">HSK 3 - Intermediate</SelectItem>
                <SelectItem value="4" className="text-slate-300">HSK 4 - Upper Intermediate</SelectItem>
                <SelectItem value="5" className="text-slate-300">HSK 5 - Advanced</SelectItem>
                <SelectItem value="6" className="text-slate-300">HSK 6 - Proficient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="flex-1 text-slate-300"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || creating}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <p className="mt-4 text-sm text-slate-500 text-center">
        After creating, you can add vocabulary and publish your course
      </p>
    </div>
  );
}
