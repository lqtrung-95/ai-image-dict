'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Star,
  Edit2,
  Loader2,
  Check,
  Play,
} from 'lucide-react';
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

interface CourseDetails {
  course: {
    id: string;
    creatorId: string;
    creatorName: string;
    name: string;
    description?: string;
    difficultyLevel: number;
    isPublished: boolean;
    subscriberCount: number;
    ratingAvg: number | null;
    ratingCount: number;
    wordCount: number;
    isOwner: boolean;
  };
  words: CourseWord[];
  subscription: { id: string; progress_percent: number; words_learned: number } | null;
  userRating: { rating: number; review?: string } | null;
}

const HSK_COLORS = [
  'bg-green-500/20 text-green-400 border-green-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'bg-red-500/20 text-red-400 border-red-500/30',
];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [data, setData] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/courses');
          return;
        }
        throw new Error('Failed to fetch course');
      }
      const result = await response.json();
      setData(result);
      if (result.userRating) {
        setSelectedRating(result.userRating.rating);
      }
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

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/subscribe`, {
        method: data?.subscription ? 'DELETE' : 'POST',
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      toast.success(data?.subscription ? 'Unsubscribed from course' : 'Subscribed to course!');
      fetchCourse();
    } catch {
      toast.error('Failed to update subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleRate = async (rating: number) => {
    setSelectedRating(rating);
    setRatingSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error('Failed to rate course');
      toast.success('Rating submitted!');
      fetchCourse();
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
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

  if (!data) return null;

  const { course, words, subscription } = data;
  const hskColor = HSK_COLORS[course.difficultyLevel - 1] || HSK_COLORS[0];

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/courses"
          className="inline-flex items-center text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Courses
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{course.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full border ${hskColor}`}>
                HSK {course.difficultyLevel}
              </span>
            </div>
            <p className="text-slate-400 mb-2">by {course.creatorName}</p>
            {course.description && (
              <p className="text-slate-300">{course.description}</p>
            )}

            <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {course.wordCount} words
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {course.subscriberCount} subscribers
              </span>
              {course.ratingAvg !== null && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {course.ratingAvg.toFixed(1)} ({course.ratingCount} reviews)
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {course.isOwner && (
              <Link href={`/courses/${course.id}/edit`}>
                <Button variant="ghost" className="text-slate-300">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            <Button
              onClick={handleSubscribe}
              disabled={subscribing}
              className={subscription ? 'bg-slate-600 hover:bg-slate-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {subscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : subscription ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Subscribed
                </>
              ) : (
                'Subscribe'
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar for subscribers */}
        {subscription && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Your Progress</span>
              <span className="text-sm text-purple-400">
                {subscription.words_learned} / {course.wordCount} words learned
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${subscription.progress_percent}%` }}
              />
            </div>
            <div className="mt-3">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Play className="w-4 h-4 mr-2" />
                Practice Words
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rating section */}
      {subscription && (
        <Card className="p-4 bg-slate-800/50 border-slate-700 mb-6">
          <h3 className="font-medium text-white mb-3">Rate this course</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                disabled={ratingSubmitting}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= selectedRating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
            {ratingSubmitting && <Loader2 className="w-5 h-5 animate-spin text-slate-400 ml-2" />}
          </div>
        </Card>
      )}

      {/* Word list */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Vocabulary ({words.length} words)
        </h2>
        <div className="space-y-2">
          {words.map((word, index) => (
            <Card
              key={word.id}
              className="p-4 bg-slate-800/30 border-slate-700 hover:border-slate-600"
            >
              <div className="flex items-center gap-4">
                <span className="text-slate-500 text-sm w-6">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-white">{word.word_zh}</span>
                    <span className="text-slate-400">{word.word_pinyin}</span>
                    {word.hsk_level && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        HSK {word.hsk_level}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{word.word_en}</p>
                  {word.example_sentence && (
                    <p className="text-sm text-slate-500 mt-1">{word.example_sentence}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
