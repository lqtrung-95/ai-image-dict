'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  color: string;
}

interface CollectionPickerProps {
  value?: string;
  onChange: (collectionId: string | undefined) => void;
  className?: string;
}

export function CollectionPicker({ value, onChange, className }: CollectionPickerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className={`h-10 bg-slate-700/50 rounded-md animate-pulse ${className}`} />
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <Select 
      value={value || 'none'} 
      onValueChange={(val) => onChange(val === 'none' ? undefined : val)}
    >
      <SelectTrigger className={`bg-slate-700/50 border-slate-600 text-white ${className}`}>
        <SelectValue placeholder="Add to collection (optional)" />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700">
        <SelectItem value="none" className="text-slate-400">
          No collection
        </SelectItem>
        {collections.map((collection) => (
          <SelectItem
            key={collection.id}
            value={collection.id}
            className="text-white focus:bg-slate-700"
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" style={{ color: collection.color }} />
              {collection.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

