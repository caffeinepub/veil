import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useRegister, useGetSeatInfo, useValidateInviteCode } from '../hooks/useQueries';
import { Region } from '../backend';
import { getPersistedUrlParameter } from '../utils/urlParams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.Global);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const { data: seatInfo, isLoading: seatLoading } = useGetSeatInfo();
  const { data: isCodeValid, isLoading: validatingCode } = useValidateInviteCode(inviteCode);
  const registerMutation = useRegister();

  useEffect(() => {
    // Try 'code' param first (from invite link), then 'invite' as fallback
    const code = getPersistedUrlParameter('code') ?? getPersistedUrlParameter('invite');
    if (code) setInviteCode(code);
  }, []);

  const remainingSeats = seatInfo
    ? Number(seatInfo.maxSeats) - Number(seatInfo.currentSeats)
    : null;
  const noSeatsLeft = remainingSeats !== null && remainingSeats <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('An invite code is required to register.');
      return;
    }

    if (isCodeValid === false) {
      setError('This invite code is invalid or has already been used.');
      return;
    }

    if (!pseudonym.trim()) {
      setError('Please enter a pseudonym.');
      return;
    }

    try {
      await registerMutation.mutateAsync({ pseudonym: pseudonym.trim(), region, inviteCode: inviteCode.trim() });
      navigate({ to: '/login' });
    } catch (err: unknown) {
      const e = err as Error;
      const msg = e?.message ?? 'Registration failed';
      if (msg.includes('CapacityReached')) {
        setError('No seats remaining. Registration is currently closed.');
      } else if (msg.includes('AlreadyRegistered')) {
        setError('This identity is already registered. Please sign in.');
      } else if (msg.includes('InvalidInviteCode') || msg.includes('InviteCodeUsed')) {
        setError('This invite code is invalid or has already been used.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="VEIL"
            className="h-14 w-14 mx-auto rounded-2xl object-cover"
          />
          <h1 className="text-2xl font-serif font-semibold text-foreground">Request Access</h1>
          <p className="text-sm text-muted-foreground">
            VEIL is invite-only. Enter your invite code to create an account.
          </p>
        </div>

        {/* Seat Counter */}
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
          <Users className="h-4 w-4 shrink-0" />
          {seatLoading ? (
            <span>Checking availability…</span>
          ) : noSeatsLeft ? (
            <span className="text-destructive font-medium">No seats remaining — registration is closed.</span>
          ) : (
            <span>
              <span className="font-semibold text-foreground">{remainingSeats}</span> of{' '}
              <span className="font-semibold text-foreground">{seatInfo ? Number(seatInfo.maxSeats) : '—'}</span> seats remaining
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter your invite code"
              disabled={noSeatsLeft || registerMutation.isPending}
              className="font-mono"
            />
            {inviteCode.length > 0 && !validatingCode && (
              <p className={`text-xs ${isCodeValid ? 'text-green-600' : 'text-destructive'}`}>
                {isCodeValid ? '✓ Valid invite code' : '✗ Invalid or used code'}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pseudonym">Pseudonym</Label>
            <Input
              id="pseudonym"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              placeholder="Choose a pseudonym"
              disabled={noSeatsLeft || registerMutation.isPending}
              maxLength={32}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="region">Region</Label>
            <Select
              value={region}
              onValueChange={(v) => setRegion(v as Region)}
              disabled={noSeatsLeft || registerMutation.isPending}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Region.Global}>Global</SelectItem>
                <SelectItem value={Region.India}>India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            variant="secondary"
            disabled={noSeatsLeft || registerMutation.isPending || isCodeValid === false}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
