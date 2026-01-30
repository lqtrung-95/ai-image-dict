'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AnkiExportButtonProps {
  listId?: string;
  hskLevel?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function AnkiExportButton({
  listId,
  hskLevel,
  variant = 'outline',
  size = 'sm',
  className = '',
}: AnkiExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (listId) params.set('list', listId);
      if (hskLevel) params.set('hsk', hskLevel.toString());

      const response = await fetch(`/api/export/anki?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] || 'anki-export.txt';

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Anki deck exported!', {
        description: 'Import the file into Anki (File > Import)',
      });
    } catch (error) {
      toast.error('Export failed', {
        description: 'Please try again later.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      variant={variant}
      size={size}
      className={className}
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Export to Anki
    </Button>
  );
}
