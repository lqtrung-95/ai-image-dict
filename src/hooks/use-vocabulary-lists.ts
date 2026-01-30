import { useState, useEffect, useCallback } from 'react';
import { VocabularyList } from '@/types';

interface UseVocabularyListsResult {
  lists: VocabularyList[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createList: (data: { name: string; description?: string; color?: string; isPublic?: boolean }) => Promise<VocabularyList | null>;
  updateList: (id: string, data: Partial<VocabularyList>) => Promise<boolean>;
  deleteList: (id: string) => Promise<boolean>;
  addWordsToList: (listId: string, wordIds: string[]) => Promise<number>;
  removeWordsFromList: (listId: string, wordIds: string[]) => Promise<boolean>;
}

export function useVocabularyLists(): UseVocabularyListsResult {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = async (data: { name: string; description?: string; color?: string; isPublic?: boolean }): Promise<VocabularyList | null> => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create list');
      const newList = await response.json();
      setLists((prev) => [newList, ...prev]);
      return newList;
    } catch {
      return null;
    }
  };

  const updateList = async (id: string, data: Partial<VocabularyList>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update list');
      const updated = await response.json();
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      return true;
    } catch {
      return false;
    }
  };

  const deleteList = async (id: string): Promise<boolean> => {
    try {
      // Optimistic update
      setLists((prev) => prev.filter((l) => l.id !== id));
      const response = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        fetchLists(); // Revert on error
        return false;
      }
      return true;
    } catch {
      fetchLists();
      return false;
    }
  };

  const addWordsToList = async (listId: string, wordIds: string[]): Promise<number> => {
    try {
      const response = await fetch(`/api/lists/${listId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds }),
      });
      if (!response.ok) throw new Error('Failed to add words');
      const result = await response.json();
      // Refresh lists to update word counts
      fetchLists();
      return result.added || 0;
    } catch {
      return 0;
    }
  };

  const removeWordsFromList = async (listId: string, wordIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${listId}/words`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds }),
      });
      if (!response.ok) throw new Error('Failed to remove words');
      fetchLists();
      return true;
    } catch {
      return false;
    }
  };

  return {
    lists,
    loading,
    error,
    refresh: fetchLists,
    createList,
    updateList,
    deleteList,
    addWordsToList,
    removeWordsFromList,
  };
}
