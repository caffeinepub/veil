import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyProfile, useRegister } from '../hooks/useQueries';
import { Region } from '../backend';
import { getPersistedUrlParameter, clearSessionParameter } from '../utils/urlParams';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignupPage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isFetched: profileFetched, isLoading: profileLoading } = useGetMyProfile();
  const registerMutation = useRegister();

  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.india);
  const [inviteCode, setInviteCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  // Pre-fill invite code from URL query param or sessionStorage
  useEffect(() => {
    const code = getPersistedUrlParameter('code');
    if (code) setInviteCode(code);
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  // Redirect already-registered users
  useEffect(() => {
    if (isAuthenticated && profileFetched && !profileLoading && profile) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, profile, profileFetched, profileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!pseudonym.trim()) {
      setFormError('Please enter a pseudonym.');
      return;
    }
    if (!inviteCode.trim()) {
      setFormError('Please enter your invite code.');
      return;
    }

    try {
      await registerMutation.mutateAsync({ pseudonym: pseudonym.trim(), region, inviteCode: inviteCode.trim() });
      clearSessionParameter('code');
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setFormError(message);
    }
  };

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Join Veil</h1>
          <p className="text-sm text-muted-foreground">Create your anonymous identity</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pseudonym */}
          <div className="space-y-1.5">
            <Label htmlFor="pseudonym">Pseudonym</Label>
            <Input
              id="pseudonym"
              placeholder="Your anonymous name"
              value={pseudonym}
              onChange={e => setPseudonym(e.target.value)}
              disabled={registerMutation.isPending}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">This is how others will see you — no real name needed.</p>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <Label htmlFor="region">Region</Label>
            <Select
              value={region}
              onValueChange={val => setRegion(val as Region)}
              disabled={registerMutation.isPending}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Region.india}>India</SelectItem>
                <SelectItem value={Region.global}>Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invite Code */}
          <div className="space-y-1.5">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              disabled={registerMutation.isPending}
              autoComplete="off"
            />
          </div>

          {/* Inline error */}
          {formError && (
            <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Invite-only · Your identity stays anonymous
        </p>
      </div>
    </div>
  );
}
