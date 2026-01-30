'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Import, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ImportSourceSelector } from '@/components/import/import-source-selector';
import { ImportPreviewTable } from '@/components/import/import-preview-table';
import { ExtractedWord, VocabularyList, ImportSourceType } from '@/types';

type ImportStep = 'select' | 'preview';

interface ImportResult {
  importId: string;
  sourceTitle: string;
  preview: ExtractedWord[];
}

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('select');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [lists, setLists] = useState<VocabularyList[]>([]);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  const handleExtract = async (type: ImportSourceType, source: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, source }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      if (!data.preview || data.preview.length === 0) {
        toast.error('No vocabulary found in the content');
        return;
      }

      setImportResult(data);
      setStep('preview');
      toast.success(`Found ${data.preview.length} vocabulary words`);
    } catch (error) {
      console.error('Extract error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to extract vocabulary');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (selectedWords: ExtractedWord[], listId?: string) => {
    if (!importResult) return;

    setSaving(true);
    try {
      const response = await fetch('/api/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId: importResult.importId,
          words: selectedWords,
          listId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Save failed');
      }

      toast.success(data.message);

      // Reset to start
      setStep('select');
      setImportResult(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save vocabulary');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStep('select');
    setImportResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Import className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Import Vocabulary</h1>
        </div>
        <p className="text-slate-400">
          Extract Chinese vocabulary from YouTube videos, web articles, or text
        </p>
      </div>

      <Card className="p-6 bg-slate-800/50 border-slate-700">
        {step === 'select' && (
          <ImportSourceSelector onSubmit={handleExtract} loading={loading} />
        )}

        {step === 'preview' && importResult && (
          <ImportPreviewTable
            words={importResult.preview}
            sourceTitle={importResult.sourceTitle}
            lists={lists}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        )}
      </Card>

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-white mb-1">Tips for best results</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• YouTube videos with Chinese subtitles work best</li>
              <li>• For articles, choose content with natural Chinese text</li>
              <li>• Longer content yields more vocabulary words</li>
              <li>• You can import up to 10 sources per hour</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
