'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Camera, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function ProfileSettingsSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setDisplayName(data.profile?.display_name || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        // Broadcast profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data.profile }));
        toast.success('Profile updated');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const updatedProfile = { ...profile, avatar_url: data.avatarUrl };
        setProfile(updatedProfile as Profile);
        // Broadcast profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
        toast.success('Avatar updated');
      } else {
        throw new Error('Failed to upload avatar');
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
        <div className="h-32 bg-slate-700/50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const hasChanges = displayName !== (profile?.display_name || '');

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-400" />
        Profile
      </h2>

      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 hover:border-purple-500 transition-colors group"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white text-2xl font-bold">
                  {getInitials(displayName || 'User')}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-slate-500 mt-2 text-center">
              Click to change
            </p>
          </div>

          {/* Display Name */}
          <div className="flex-1 w-full">
            <label className="text-sm text-slate-400 mb-2 block">
              Display Name
            </label>
            <div className="flex gap-3">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-slate-700 border-slate-600 text-white"
                maxLength={50}
              />
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving || displayName.trim().length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This name will be displayed in the app instead of your email.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
