'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session (from the reset link)
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="">
        <Card className="w-full max-w-md bg-[#1c2024] border-white/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Password Updated</CardTitle>
            <CardDescription className="text-[#bacbbe]">
              Your password has been successfully reset
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-[#bacbbe] mb-4">
              Redirecting you to login...
            </p>
            <Link href="/login">
              <Button variant="outline" className="border-white/10 text-[#e0e2e8] hover:bg-[#272a2e]">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <Card className="w-full max-w-md bg-[#1c2024] border-white/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Set New Password</CardTitle>
          <CardDescription className="text-[#bacbbe]">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#e0e2e8]">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-[#272a2e] border-white/10 text-white placeholder:text-[#bacbbe]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#e0e2e8]">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[#272a2e] border-white/10 text-white placeholder:text-[#bacbbe]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#76ffbb] hover:opacity-90 text-[#003822] font-semibold"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center text-[#bacbbe]">
            <Link href="/login" className="text-[#76ffbb] hover:text-[#76ffbb]/80 font-medium">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
