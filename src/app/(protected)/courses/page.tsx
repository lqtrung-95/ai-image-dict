'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, BookOpen, Loader2 } from 'lucide-react';
import { CourseCard } from '@/components/courses/course-card';

interface Course {
  id: string;
  name: string;
  description?: string;
  difficultyLevel: number;
  subscriberCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  wordCount: number;
  creatorName?: string;
  isSubscribed?: boolean;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, [difficulty, sort, page]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
      if (sort) params.set('sort', sort);
      if (search) params.set('q', search);
      params.set('page', page.toString());

      const response = await fetch(`/api/courses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Courses</h1>
          <p className="text-slate-400">Learn from curated vocabulary courses</p>
        </div>
        <Link href="/courses/create">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="pl-9 bg-slate-800/50 border-slate-700 text-white"
          />
        </form>
        <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="HSK Level" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-300">All Levels</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <SelectItem key={level} value={level.toString()} className="text-slate-300">
                HSK {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="newest" className="text-slate-300">Newest</SelectItem>
            <SelectItem value="popular" className="text-slate-300">Popular</SelectItem>
            <SelectItem value="rating" className="text-slate-300">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No courses found</h2>
          <p className="text-slate-400 mb-6">Be the first to create a course!</p>
          <Link href="/courses/create">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-slate-300"
              >
                Previous
              </Button>
              <span className="text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-slate-300"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
