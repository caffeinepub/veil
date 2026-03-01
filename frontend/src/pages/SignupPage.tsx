import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRegister } from '../hooks/useQueries';
import { Region } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

const ANONYMOUS_PRINCIPAL = '2vxsx-fae';

function isValidPrincipal(identity: ReturnType<typeof useInternetIdentity>['identity']): boolean {
  if (!identity) return false;
  const principal = identity.getPrincipal();
  if (!principal) return false;
  if (principal.isAnonymous()) return false;
  if (principal.toText() === ANONYMOUS_PRINCIPAL) return false;
  return true;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const register = useRegister();

  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.Global);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = isValidPrincipal(identity);

  // Pre-fill invite code from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code') || params.get('invite');
    if (codeFromUrl) setInviteCode(codeFromUrl);
  }, []);

  // Only redirect after initialization is complete and we know the user is not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Guard: ensure initialization is complete
    if (isInitializing) {
      setError('Authentication is still initializing. Please wait a moment and try again.');
      return;
    }

    // Guard: ensure identity exists and is not anonymous
    if (!identity) {
      setError('Authentication required. Please log in before creating an account.');
      return;
    }

    const principal = identity.getPrincipal();
    if (!principal || principal.isAnonymous() || principal.toText() === ANONYMOUS_PRINCIPAL) {
      setError('Authentication required. Please log in before creating an account.');
      return;
    }

    if (!pseudonym.trim()) {
      setError('Please enter a pseudonym.');
      return;
    }

    if (!inviteCode.trim()) {
      setError('An invite code is required to join Veil.');
      return;
    }

    try {
      await register.mutateAsync({ pseudonym: pseudonym.trim(), region, inviteCode: inviteCode.trim() });
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    }
  };

  // Show loading state while identity is initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Verifying your identity…</p>
        </div>
      </div>
    );
  }

  // Don't render the form if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return null;
  }

  const isButtonDisabled = register.isPending || !pseudonym.trim() || !inviteCode.trim() || !isAuthenticated || isInitializing;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-foreground">Create your veil</h1>
          <p className="text-muted-foreground text-sm">
            You need an invite code to join. Choose a pseudonym to keep your identity private.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft">
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Invite Code */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-sm font-medium text-foreground">
                Invite Code
              </Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter your invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={register.isPending}
                className="bg-background font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Veil is invite-only. You need a valid code to register.
              </p>
            </div>

            {/* Pseudonym */}
            <div className="space-y-2">
              <Label htmlFor="pseudonym" className="text-sm font-medium text-foreground">
                Pseudonym
              </Label>
              <Input
                id="pseudonym"
                type="text"
                placeholder="e.g. quietstorm, morningdew…"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                maxLength={32}
                disabled={register.isPending}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                This is how others will see you. Choose something that feels like you.
              </p>
            </div>

            {/* Region */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Region</Label>
              <RadioGroup
                value={region}
                onValueChange={(val) => setRegion(val as Region)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={Region.India} id="region-india" disabled={register.isPending} />
                  <Label htmlFor="region-india" className="cursor-pointer text-sm">
                    🇮🇳 India
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={Region.Global} id="region-global" disabled={register.isPending} />
                  <Label htmlFor="region-global" className="cursor-pointer text-sm">
                    🌍 Global
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isButtonDisabled}
              className="w-full"
              size="lg"
            >
              {register.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your veil…
                </>
              ) : (
                'Enter Veil'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
