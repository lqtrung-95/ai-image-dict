'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, BookOpen, Users, Star, Edit2, Loader2, Check, Play,
  Search, ChevronLeft, ChevronRight, X,
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
  state?: 'new' | 'learning' | 'mastered';
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
  wordsTotalCount: number;
  wordsFilteredCount: number;
  wordsPage: number;
  wordsTotalPages: number;
  subscription: { id: string; progress_percent: number; words_learned: number } | null;
  userRating: { rating: number; review?: string } | null;
}

const HSK_COLORS = [
  'bg-green-500/20 text-green-400 border-green-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-[#76ffbb]/10 text-[#76ffbb] border-[#76ffbb]/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'bg-red-500/20 text-red-400 border-red-500/30',
];

const STATE_DOT: Record<string, string> = {
  mastered: 'bg-[#76ffbb]',
  learning: 'bg-yellow-400',
  new: 'bg-white/20',
};

const WORDS_PER_PAGE = 50;

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [data, setData] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCourse = useCallback(async (opts?: { page?: number; search?: string; wordsOnly?: boolean }) => {
    const pg = opts?.page ?? page;
    const q = opts?.search ?? search;
    const url = `/api/courses/${courseId}?wordsPage=${pg}&wordsLimit=${WORDS_PER_PAGE}${q ? `&wordsSearch=${encodeURIComponent(q)}` : ''}`;

    if (opts?.wordsOnly) {
      setWordsLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) { router.push('/courses'); return; }
        throw new Error('Failed to fetch course');
      }
      const result = await response.json();
      setData(result);
      if (result.userRating && !opts?.wordsOnly) {
        setSelectedRating(result.userRating.rating);
      }
    } catch {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
      setWordsLoading(false);
    }
  }, [courseId, router, page, search]);

  useEffect(() => { fetchCourse(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
      fetchCourse({ page: 1, search: value, wordsOnly: true });
    }, 350);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCourse({ page: newPage, wordsOnly: true });
    document.getElementById('word-list-top')?.scrollIntoView({ behavior: 'smooth' });
  };

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
          <Loader2 className="w-8 h-8 animate-spin text-[#76ffbb]" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { course, words, subscription } = data;
  const hskColor = HSK_COLORS[course.difficultyLevel - 1] || HSK_COLORS[0];
  const totalPages = data.wordsTotalPages;
  const totalWordCount = data.wordsTotalCount;
  const filteredCount = data.wordsFilteredCount;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/courses" className="inline-flex items-center text-[#bacbbe] hover:text-[#e0e2e8] mb-4">
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
            <p className="text-[#bacbbe] mb-2">by {course.creatorName}</p>
            {course.description && <p className="text-[#e0e2e8]">{course.description}</p>}

            <div className="flex items-center gap-4 mt-4 text-sm text-[#bacbbe]">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {totalWordCount} words
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
                <Button variant="ghost" className="text-[#e0e2e8]">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            <Button
              onClick={handleSubscribe}
              disabled={subscribing}
              className={subscription
                ? 'bg-[#272a2e] border border-white/10 text-[#bacbbe] hover:bg-[#272a2e]/80'
                : 'bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90'}
            >
              {subscribing ? <Loader2 className="w-4 h-4 animate-spin" />
                : subscription ? <><Check className="w-4 h-4 mr-2" />Subscribed</>
                : 'Subscribe'}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {subscription && (
          <div className="mt-4 p-4 bg-[#1c2024] rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#bacbbe]">Your Progress</span>
              <span className="text-sm text-[#76ffbb]">
                {subscription.words_learned} / {totalWordCount} words learned
              </span>
            </div>
            <div className="h-2 bg-[#272a2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#76ffbb] rounded-full transition-all"
                style={{ width: `${subscription.progress_percent}%` }}
              />
            </div>
            <div className="mt-3">
              <Button className="bg-[#76ffbb] hover:opacity-90">
                <Play className="w-4 h-4 mr-2" />
                Practice Words
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      {subscription && (
        <Card className="p-4 bg-[#1c2024] border-white/10 mb-6">
          <h3 className="font-medium text-white mb-3">Rate this course</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => handleRate(star)} disabled={ratingSubmitting} className="transition-transform hover:scale-110">
                <Star className={`w-8 h-8 ${star <= selectedRating ? 'text-yellow-400 fill-yellow-400' : 'text-[#849589]'}`} />
              </button>
            ))}
            {ratingSubmitting && <Loader2 className="w-5 h-5 animate-spin text-[#bacbbe] ml-2" />}
          </div>
        </Card>
      )}

      {/* Word list */}
      <div id="word-list-top">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">
            Vocabulary
            <span className="ml-2 text-sm font-normal text-[#849589]">
              {search ? `${filteredCount} of ${totalWordCount}` : totalWordCount} words
            </span>
          </h2>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#849589]" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search characters, pinyin…"
              className="pl-9 pr-8 bg-[#1c2024] border-white/10 text-[#e0e2e8] placeholder:text-[#849589] focus:border-[#76ffbb]/50"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#849589] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* State legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-[#849589]">
          {(['mastered', 'learning', 'new'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STATE_DOT[s]}`} />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          ))}
        </div>

        {wordsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#76ffbb]" />
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-12 text-[#849589]">
            {search ? 'No words match your search.' : 'No words in this course yet.'}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {words.map((word, index) => (
                <Card key={word.id} className="p-4 bg-[#1c2024]/50 border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-[#849589] text-sm w-8 text-right flex-shrink-0">
                      {(page - 1) * WORDS_PER_PAGE + index + 1}
                    </span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATE_DOT[word.state ?? 'new']}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl font-medium text-white">{word.word_zh}</span>
                        <span className="text-[#76ffbb] text-sm">{word.word_pinyin}</span>
                        {word.hsk_level && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#76ffbb]/10 text-[#76ffbb]/80">
                            HSK {word.hsk_level}
                          </span>
                        )}
                      </div>
                      <p className="text-[#bacbbe] text-sm mt-0.5">{word.word_en}</p>
                      {word.example_sentence && (
                        <p className="text-sm text-[#849589] mt-1">{word.example_sentence}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-[#849589]">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="text-[#bacbbe] hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </Button>

                  {/* Page number pills */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pg: number;
                      if (totalPages <= 5) pg = i + 1;
                      else if (page <= 3) pg = i + 1;
                      else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                      else pg = page - 2 + i;
                      return (
                        <button
                          key={pg}
                          onClick={() => handlePageChange(pg)}
                          className={`w-8 h-8 rounded text-sm transition-colors ${
                            pg === page
                              ? 'bg-[#76ffbb] text-[#003822] font-semibold'
                              : 'text-[#bacbbe] hover:bg-[#272a2e]'
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="text-[#bacbbe] hover:text-white disabled:opacity-30"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
