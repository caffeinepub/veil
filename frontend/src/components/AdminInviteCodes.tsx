import { useState } from 'react';
import { useAdminGetInviteCodes, useAdminAddInviteCode, useAdminGenerateInviteCode, useAdminRevokeInviteCode } from '../hooks/useQueries';
import { type InviteCode } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Trash2, Plus, RefreshCw, Check } from 'lucide-react';

export default function AdminInviteCodes() {
  const { data: codes, isLoading } = useAdminGetInviteCodes();
  const addCode = useAdminAddInviteCode();
  const generateCode = useAdminGenerateInviteCode();
  const revokeCode = useAdminRevokeInviteCode();

  const [newCode, setNewCode] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [revokeErrors, setRevokeErrors] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newCode.trim()) {
      setAddError('Please enter a code.');
      return;
    }
    try {
      await addCode.mutateAsync({ code: newCode.trim() });
      setNewCode('');
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add code.');
    }
  };

  const handleGenerate = async () => {
    try {
      await generateCode.mutateAsync();
    } catch {
      // silently handle
    }
  };

  const handleRevoke = async (code: string) => {
    try {
      await revokeCode.mutateAsync({ code });
      setRevokeErrors(prev => { const n = { ...prev }; delete n[code]; return n; });
    } catch (err: unknown) {
      setRevokeErrors(prev => ({ ...prev, [code]: err instanceof Error ? err.message : 'Failed to revoke.' }));
    }
  };

  const handleCopy = (code: string) => {
    const link = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const unusedCodes = (codes ?? []).filter((c: InviteCode) => !c.used);
  const usedCodes = (codes ?? []).filter((c: InviteCode) => c.used);

  return (
    <div className="space-y-6">
      {/* Add new code */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Add Invite Code</p>
        <form onSubmit={handleAddCode} className="flex gap-2">
          <Input
            placeholder="Enter custom code"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            disabled={addCode.isPending}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={addCode.isPending}>
            {addCode.isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generateCode.isPending}
            title="Generate random code"
          >
            {generateCode.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
          </Button>
        </form>
        {addError && <p className="text-xs text-amber-700 dark:text-amber-400">{addError}</p>}
      </div>

      {/* Unused codes */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Unused Codes <span className="text-muted-foreground font-normal">({unusedCodes.length})</span>
        </p>
        {unusedCodes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No unused codes.</p>
        ) : (
          <div className="space-y-2">
            {unusedCodes.map((ic: InviteCode) => (
              <div key={ic.code} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                <code className="text-xs font-mono flex-1 text-foreground">{ic.code}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(ic.code)}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  title="Copy signup link"
                >
                  {copiedCode === ic.code ? <Check size={13} /> : <Copy size={13} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(ic.code)}
                  disabled={revokeCode.isPending}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  title="Revoke code"
                >
                  {revokeCode.isPending ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                </Button>
                {revokeErrors[ic.code] && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">{revokeErrors[ic.code]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used codes */}
      {usedCodes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Used Codes <span className="text-muted-foreground font-normal">({usedCodes.length})</span>
          </p>
          <div className="space-y-1">
            {usedCodes.map((ic: InviteCode) => (
              <div key={ic.code} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border opacity-60">
                <code className="text-xs font-mono flex-1 text-muted-foreground line-through">{ic.code}</code>
                <span className="text-xs text-muted-foreground">Used</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
