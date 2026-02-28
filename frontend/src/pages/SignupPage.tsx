import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRegister } from '../hooks/useQueries';
import { Region } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const register = useRegister();

  const [inviteCode, setInviteCode] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.global);
  const [error, setError] = useState('');

  if (!identity) {
    navigate({ to: '/login' });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pseudonym.trim()) {
      setError('Please choose a pseudonymous name.');
      return;
    }
    if (!inviteCode.trim()) {
      setError('Please enter your invite code.');
      return;
    }

    try {
      await register.mutateAsync({ pseudonym: pseudonym.trim(), region, inviteCode: inviteCode.trim() });
      navigate({ to: '/' });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('capacity')) {
        setError('Veil is currently at capacity. No new members can join at this time.');
      } else if (msg.includes('Invalid') || msg.includes('invite')) {
        setError('This invite code is invalid or has already been used.');
      } else if (msg.includes('Already registered')) {
        navigate({ to: '/' });
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-3">
            Join Veil
          </h1>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">
            Choose a name only you will know you by. No real names here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invite Code */}
          <div className="space-y-2">
            <Label htmlFor="inviteCode" className="font-sans text-sm text-foreground">
              Invite Code
            </Label>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter your invite code"
              className="h-12 rounded-xl font-sans"
              autoComplete="off"
            />
          </div>

          {/* Pseudonym */}
          <div className="space-y-2">
            <Label htmlFor="pseudonym" className="font-sans text-sm text-foreground">
              Your Pseudonymous Name
            </Label>
            <Input
              id="pseudonym"
              type="text"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              placeholder="e.g. quietmoon, saltwater, ember"
              className="h-12 rounded-xl font-sans"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground font-sans">
              This is how others will see you. No real names.
            </p>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label className="font-sans text-sm text-foreground">Region</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRegion(Region.india)}
                className={`h-12 rounded-xl border font-sans text-sm transition-all ${
                  region === Region.india
                    ? 'border-primary bg-primary/8 text-foreground font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                India
                <span className="block text-xs font-normal mt-0.5 opacity-70">₹150/month</span>
              </button>
              <button
                type="button"
                onClick={() => setRegion(Region.global)}
                className={`h-12 rounded-xl border font-sans text-sm transition-all ${
                  region === Region.global
                    ? 'border-primary bg-primary/8 text-foreground font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                Global
                <span className="block text-xs font-normal mt-0.5 opacity-70">$9/month</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted border border-border">
              <AlertCircle size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground font-sans">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={register.isPending}
            className="w-full h-12 font-sans text-base rounded-xl"
          >
            {register.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Creating your space...
              </span>
            ) : (
              'Enter Veil'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground font-sans leading-relaxed">
          15-day grace period begins immediately. No payment required to start.
        </p>
      </div>
    </div>
  );
}
