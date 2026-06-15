'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Zap, Camera, BookOpen, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  usage?: {
    current: number;
    limit: number;
  };
}

const PREMIUM_FEATURES = [
  { icon: Camera, text: 'Unlimited photo analyses' },
  { icon: BookOpen, text: 'Unlimited vocabulary saves' },
  { icon: Zap, text: 'Priority AI processing' },
  { icon: Sparkles, text: 'No daily limits' },
];

export function UpgradeModal({ open, onClose, usage }: UpgradeModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/upgrade-interest', {
        method: 'POST',
        body: JSON.stringify({
          email: email || null,
          reason: 'limit_reached',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Thanks! We'll notify you when Premium launches.");
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#101417] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#76ffbb] to-pink-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Daily Limit Reached</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Usage indicator */}
          {usage && (
            <div className="text-center">
              <p className="text-[#bacbbe]">
                You&apos;ve used{' '}
                <span className="text-white font-semibold">
                  {usage.current}/{usage.limit}
                </span>{' '}
                free analyses today
              </p>
              <div className="mt-2 h-2 bg-[#272a2e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#76ffbb] to-pink-500 transition-all"
                  style={{ width: `${Math.min(100, (usage.current / usage.limit) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Premium features */}
          <div className="space-y-3">
            <p className="text-sm text-[#bacbbe] text-center">
              Upgrade to Premium for unlimited access:
            </p>
            <div className="grid gap-2">
              {PREMIUM_FEATURES.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#1c2024] border border-white/10"
                >
                  <feature.icon className="w-5 h-5 text-[#76ffbb]" />
                  <span className="text-[#e0e2e8]">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interest capture */}
          {submitted ? (
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">You&apos;re on the list!</p>
              <p className="text-sm text-[#bacbbe] mt-1">
                We&apos;ll email you when Premium is ready.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#bacbbe] text-center">
                Premium is coming soon! Get notified:
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#1c2024] border-white/10 text-white placeholder:text-[#849589]"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#76ffbb] to-pink-600 hover:from-purple-700 hover:to-pink-700 whitespace-nowrap"
                >
                  {isSubmitting ? 'Saving...' : 'Notify Me'}
                </Button>
              </div>
            </div>
          )}

          {/* Reset time hint */}
          <p className="text-xs text-[#849589] text-center">
            Your free analyses reset at midnight UTC.
            <br />
            Come back tomorrow for {usage?.limit || 6} more!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

