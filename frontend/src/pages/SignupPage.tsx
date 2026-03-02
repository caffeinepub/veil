import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useRegister, useGetSeatInfo } from '../hooks/useQueries';
import { Region } from '../backend';
import { getPersistedUrlParameter } from '../utils/urlParams';

export default function SignupPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const { data: seatInfo } = useGetSeatInfo();

  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.Global);
  const [inviteCode, setInviteCode] = useState(getPersistedUrlParameter('invite') || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pseudonym.trim()) {
      setError('Please enter a display name.');
      return;
    }
    if (!inviteCode.trim()) {
      setError('An invite code is required.');
      return;
    }

    try {
      // useRegister throws on error, returns User on success
      await register.mutateAsync({
        pseudonym: pseudonym.trim(),
        region,
        inviteCode: inviteCode.trim(),
      });
      navigate({ to: '/login' });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    }
  };

  const seatsLeft = seatInfo
    ? Number(seatInfo.maxSeats) - Number(seatInfo.currentSeats)
    : null;

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl font-medium text-foreground">Request access</h1>
          <p className="text-sm text-muted-foreground">
            Veil is a small, private community. An invite code is required.
          </p>
          {seatsLeft !== null && (
            <p className="text-xs text-muted-foreground">
              {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} remaining.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Anonymous display name</label>
            <input
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              placeholder="e.g. quiet_river"
              required
              className="text-sm bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              className="text-sm bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={Region.Global}>Global</option>
              <option value={Region.India}>India</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Invite code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter your invite code"
              required
              className="text-sm bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 disabled:opacity-40"
          >
            {register.isPending ? 'Joining…' : 'Join Veil'}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Already a member?{' '}
          <Link to="/login" className="text-foreground hover:opacity-70">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
