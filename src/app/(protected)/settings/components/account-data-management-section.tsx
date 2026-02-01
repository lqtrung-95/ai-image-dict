'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Trash2,
  AlertTriangle,
  FileJson,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

export function AccountDataManagementSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'deleting' | 'success'>('confirm');

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await apiFetch('/api/user/export');

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] || 'ai-dictionary-export.json';

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully', {
        description: 'Your data has been downloaded as a JSON file.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', {
        description: 'Please try again later.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE_MY_ACCOUNT') {
      toast.error('Invalid confirmation', {
        description: 'Please type DELETE_MY_ACCOUNT to confirm.',
      });
      return;
    }

    setDeleteStep('deleting');

    try {
      const response = await apiFetch('/api/user/delete', {
        method: 'POST',
        body: JSON.stringify({ confirmation: confirmationText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      setDeleteStep('success');

      // Redirect to home page after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
      setDeleteStep('confirm');
    }
  };

  const openDeleteDialog = () => {
    setConfirmationText('');
    setDeleteStep('confirm');
    setShowDeleteDialog(true);
  };

  return (
    <>
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-400" />
          Data & Privacy
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Manage your data and privacy settings. Export your data or delete your account.
        </p>

        <div className="space-y-4">
          {/* Export Data */}
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">Export Your Data</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Download all your vocabulary, lists, practice history, and settings as a JSON file.
                    This is useful for backups or if you want to move your data elsewhere.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 whitespace-nowrap"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            </div>
          </Card>

          {/* Delete Account */}
          <Card className="bg-red-950/20 border-red-900/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">Delete Account</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    Your vocabulary, lists, practice history, and all other data will be permanently removed.
                  </p>
                </div>
              </div>
              <Button
                onClick={openDeleteDialog}
                disabled={isDeleting}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          {deleteStep === 'confirm' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Delete Account
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  This action is permanent and cannot be undone. All your data will be permanently deleted.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-sm text-red-300">
                  <p className="font-medium mb-1">This will delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-400/80">
                    <li>All vocabulary words</li>
                    <li>All lists and collections</li>
                    <li>Practice history and statistics</li>
                    <li>Photo analyses</li>
                    <li>SRS learning data</li>
                    <li>Your profile and settings</li>
                  </ul>
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Type <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-400">DELETE_MY_ACCOUNT</code> to confirm:
                  </label>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="DELETE_MY_ACCOUNT"
                    className="bg-slate-800 border-slate-700 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDeleteAccount();
                      }
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={confirmationText !== 'DELETE_MY_ACCOUNT'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteStep === 'deleting' && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Deleting Account...</h3>
              <p className="text-slate-400 text-sm">
                This may take a moment. Please don&apos;t close this window.
              </p>
            </div>
          )}

          {deleteStep === 'success' && (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Account Deleted</h3>
              <p className="text-slate-400 text-sm">
                Your account has been permanently deleted. Redirecting to homepage...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
