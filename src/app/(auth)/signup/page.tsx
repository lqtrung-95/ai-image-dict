'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthDivider, SocialAuthButtons } from '@/components/auth/social-auth-buttons';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Create profile manually if user was created
    if (authData.user) {
      try {
        // Create profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          display_name: displayName || email,
        });

        // Create user stats
        await supabase.from('user_stats').insert({
          id: authData.user.id,
          current_streak: 0,
          longest_streak: 0,
          total_words_learned: 0,
          total_practice_sessions: 0,
        });
      } catch (err) {
        // Non-critical error, user can still use the app
        console.log('Profile creation skipped:', err);
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-lg">
        <Card className="w-full bg-[#1c2024] border-white/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Check Your Email</CardTitle>
            <CardDescription className="text-[#bacbbe]">
              We&apos;ve sent you a confirmation link to <strong className="text-white">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-[#bacbbe] mb-4">
              Click the link in the email to verify your account and start learning.
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="border-white/10 text-[#e0e2e8] hover:bg-[#272a2e]"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <Card className="w-full bg-[#1c2024] border-white/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
          <CardDescription className="text-[#bacbbe]">
            Start your Chinese vocabulary journey today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialAuthButtons redirectTo="/" />
          <AuthDivider />

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#e0e2e8]">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-[#272a2e] border-white/10 text-white placeholder:text-[#bacbbe]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e0e2e8]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#272a2e] border-white/10 text-white placeholder:text-[#bacbbe]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#e0e2e8]">
                Password
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
              <p className="text-xs text-[#849589]">Must be at least 6 characters</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#76ffbb] hover:opacity-90 text-[#003822] font-semibold"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-[#bacbbe]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#76ffbb] hover:text-[#76ffbb]/80 font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

