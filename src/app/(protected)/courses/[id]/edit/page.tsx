'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Trash2, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface CourseWord {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  example_sentence?: string;
  hsk_level?: number;
  sort_order: number;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  difficulty_level: number;
  is_published: boolean;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [words, setWords] = useState<CourseWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('1');
  const [isPublished, setIsPublished] = useState(false);

  // New word form
  const [newWord, setNewWord] = useState({ zh: '', pinyin: '', en: '', example: '' });
  const [addingWord, setAddingWord] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        router.push('/courses');
        return;
      }
      const data = await response.json();
      if (!data.course.isOwner) {
        router.push(`/courses/${courseId}`);
        return;
      }
      setCourse(data.course);
      setWords(data.words);
      setName(data.course.name);
      setDescription(data.course.description || '');
      setDifficultyLevel(data.course.difficultyLevel.toString());
      setIsPublished(data.course.isPublished);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          difficultyLevel: parseInt(difficultyLevel),
          isPublished,
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success('Course saved!');
    } catch {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.zh || !newWord.pinyin || !newWord.en) {
      toast.error('Chinese, Pinyin, and English are required');
      return;
    }

    setAddingWord(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordZh: newWord.zh.trim(),
          wordPinyin: newWord.pinyin.trim(),
          wordEn: newWord.en.trim(),
          exampleSentence: newWord.example.trim() || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to add word');
      const word = await response.json();
      setWords((prev) => [...prev, word]);
      setNewWord({ zh: '', pinyin: '', en: '', example: '' });
      toast.success('Word added!');
    } catch {
      toast.error('Failed to add word');
    } finally {
      setAddingWord(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/words`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      if (!response.ok) throw new Error('Failed to delete');
      setWords((prev) => prev.filter((w) => w.id !== wordId));
      toast.success('Word removed');
    } catch {
      toast.error('Failed to remove word');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Course
        </Link>
        <div className="flex gap-2">
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" className="text-slate-300">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Edit Course</h1>

      {/* Course details */}
      <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
        <div className="space-y-4">
          <div>
            <Label className="text-slate-200">Course Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              maxLength={150}
            />
          </div>
          <div>
            <Label className="text-slate-200">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 bg-slate-700/50 border-slate-600 text-white resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-slate-200">Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <SelectItem key={level} value={level.toString()} className="text-slate-300">
                      HSK {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <div>
                <Label className="text-slate-200">Published</Label>
                <p className="text-xs text-slate-500">Visible to all users</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>
        </div>
      </Card>

      {/* Add word form */}
      <Card className="p-4 bg-slate-800/50 border-slate-700 mb-4">
        <h3 className="font-medium text-white mb-3">Add Word</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            value={newWord.zh}
            onChange={(e) => setNewWord((p) => ({ ...p, zh: e.target.value }))}
            placeholder="中文"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Input
            value={newWord.pinyin}
            onChange={(e) => setNewWord((p) => ({ ...p, pinyin: e.target.value }))}
            placeholder="pīnyīn"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Input
            value={newWord.en}
            onChange={(e) => setNewWord((p) => ({ ...p, en: e.target.value }))}
            placeholder="English"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Button
            onClick={handleAddWord}
            disabled={addingWord || !newWord.zh || !newWord.pinyin || !newWord.en}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {addingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      {/* Word list */}
      <div>
        <h3 className="font-medium text-white mb-3">Words ({words.length})</h3>
        <div className="space-y-2">
          {words.map((word, index) => (
            <Card
              key={word.id}
              className="p-3 bg-slate-800/30 border-slate-700 flex items-center gap-3"
            >
              <span className="text-slate-500 text-sm w-6">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{word.word_zh}</span>
                  <span className="text-slate-400 text-sm">{word.word_pinyin}</span>
                </div>
                <p className="text-sm text-slate-400 truncate">{word.word_en}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteWord(word.id)}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
          {words.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              No words yet. Add some vocabulary above!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
