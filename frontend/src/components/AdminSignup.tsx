import { useState } from 'react';
import { useRegister, useGenerateInviteCode } from '../hooks/useQueries';
import { Region } from '../backend';
import { toast } from 'sonner';

export default function AdminSignup() {
  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.Global);
  const adminRegister = useRegister();
  const generateCode = useGenerateInviteCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudonym.trim()) return;

    try {
      const code = await generateCode.mutateAsync();
      await adminRegister.mutateAsync({ pseudonym: pseudonym.trim(), region, inviteCode: code });
      toast.success('Member account created.');
      setPseudonym('');
      setRegion(Region.Global);
    } catch (err: any) {
      toast.error(err?.message || 'Could not create account.');
    }
  };

  const isPending = generateCode.isPending || adminRegister.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
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

      <button
        type="submit"
        disabled={isPending || !pseudonym.trim()}
        className="py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 disabled:opacity-40"
      >
        {isPending ? 'Creating…' : 'Create member account'}
      </button>
    </form>
  );
}
