import { useState } from 'react';
import { useGetInviteCodes, useAddInviteCode, useGenerateInviteCode, useRevokeInviteCode } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Trash2, Copy, Check, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInviteCodes() {
  const { data: codes, isLoading } = useGetInviteCodes();
  const addCode = useAddInviteCode();
  const generateCode = useGenerateInviteCode();
  const revokeCode = useRevokeInviteCode();
  const [newCode, setNewCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    try {
      await addCode.mutateAsync(newCode.trim());
      setNewCode('');
      toast.success('Invite code added.');
    } catch {
      toast.error('Could not add invite code.');
    }
  };

  const handleGenerate = async () => {
    try {
      const code = await generateCode.mutateAsync();
      toast.success(`Code generated: ${code}`);
    } catch {
      toast.error('Could not generate code.');
    }
  };

  const handleRevoke = async (code: string) => {
    try {
      await revokeCode.mutateAsync(code);
      toast.success('Code revoked.');
    } catch {
      toast.error('Could not revoke code.');
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const unusedCodes = codes?.filter((c) => !c.used) || [];
  const usedCodes = codes?.filter((c) => c.used) || [];

  return (
    <div className="space-y-6">
      {/* Add / Generate */}
      <div className="veil-card p-6 space-y-4">
        <h3 className="font-sans text-sm font-medium text-foreground flex items-center gap-2">
          <Ticket size={15} className="text-muted-foreground" />
          Add Invite Code
        </h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Enter a custom code"
            className="rounded-xl font-sans text-sm"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={addCode.isPending || !newCode.trim()}
            className="rounded-xl font-sans text-sm gap-1.5"
          >
            {addCode.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Add
          </Button>
        </form>
        <Button
          variant="outline"
          onClick={handleGenerate}
          disabled={generateCode.isPending}
          className="rounded-xl font-sans text-sm gap-1.5 w-full"
        >
          {generateCode.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Generate Random Code
        </Button>
      </div>

      {/* Active codes */}
      <div className="space-y-3">
        <h3 className="font-sans text-sm font-medium text-foreground">
          Active Codes ({unusedCodes.length})
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : unusedCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans py-4 text-center">No active codes.</p>
        ) : (
          unusedCodes.map((code) => (
            <div key={code.code} className="veil-card p-4 flex items-center justify-between gap-4">
              <code className="font-mono text-sm text-foreground break-all">{code.code}</code>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(code.code)}
                  className="rounded-lg h-8 w-8 p-0"
                >
                  {copiedCode === code.code ? <Check size={13} className="text-status-grace" /> : <Copy size={13} />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(code.code)}
                  disabled={revokeCode.isPending}
                  className="rounded-lg h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  {revokeCode.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Used codes */}
      {usedCodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-sans text-sm font-medium text-muted-foreground">
            Used Codes ({usedCodes.length})
          </h3>
          {usedCodes.map((code) => (
            <div key={code.code} className="veil-card p-4 flex items-center justify-between gap-4 opacity-50">
              <code className="font-mono text-sm text-muted-foreground break-all">{code.code}</code>
              <span className="text-xs text-muted-foreground font-sans shrink-0">Used</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
