'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Globe, FileText, Loader2 } from 'lucide-react';
import { ImportSourceType } from '@/types';

interface ImportSourceSelectorProps {
  onSubmit: (type: ImportSourceType, source: string) => Promise<void>;
  loading: boolean;
}

export function ImportSourceSelector({ onSubmit, loading }: ImportSourceSelectorProps) {
  const [activeTab, setActiveTab] = useState<ImportSourceType>('text');
  const [articleUrl, setArticleUrl] = useState('');
  const [textContent, setTextContent] = useState('');

  const handleSubmit = () => {
    if (activeTab === 'url' && articleUrl.trim()) {
      onSubmit('url', articleUrl.trim());
    } else if (activeTab === 'text' && textContent.trim()) {
      onSubmit('text', textContent.trim());
    }
  };

  const isValid = () => {
    if (activeTab === 'url') return articleUrl.trim().length > 0;
    if (activeTab === 'text') return textContent.trim().length >= 50;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Tab buttons */}
      <div className="flex gap-2 p-1 bg-[#1c2024] rounded-lg">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md transition-colors ${
            activeTab === 'text'
              ? 'bg-[#76ffbb] text-white'
              : 'text-[#bacbbe] hover:text-[#e0e2e8] hover:bg-[#272a2e]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Text</span>
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md transition-colors ${
            activeTab === 'url'
              ? 'bg-[#76ffbb] text-white'
              : 'text-[#bacbbe] hover:text-[#e0e2e8] hover:bg-[#272a2e]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Web Article</span>
        </button>
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === 'text' && (
          <div>
            <Label className="text-[#e0e2e8]">Chinese Text</Label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste Chinese text here (at least 50 characters)...&#10;&#10;Tip: You can copy YouTube transcripts by clicking &quot;...more&quot; → &quot;Show transcript&quot; on any video."
              className="mt-1 bg-[#1c2024] border-white/10 text-white min-h-[200px] resize-none"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-[#bacbbe]">
              {textContent.length} / 50 characters minimum
            </p>
          </div>
        )}

        {activeTab === 'url' && (
          <div>
            <Label className="text-[#e0e2e8]">Article URL</Label>
            <Input
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="mt-1 bg-[#1c2024] border-white/10 text-white"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-[#bacbbe]">
              Paste a URL to any Chinese article or webpage
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid() || loading}
        className="w-full bg-[#76ffbb] hover:opacity-90"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Extracting vocabulary...
          </>
        ) : (
          'Extract Vocabulary'
        )}
      </Button>
    </div>
  );
}
