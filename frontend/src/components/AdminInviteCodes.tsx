import React from 'react';
import { useGetInviteCodes, useGenerateInviteCode, useRevokeInviteCode } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Copy, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInviteCodes() {
  const { data: codes, isLoading } = useGetInviteCodes();
  const generateCode = useGenerateInviteCode();
  const revokeCode = useRevokeInviteCode();

  const handleGenerate = async () => {
    try {
      const code = await generateCode.mutateAsync();
      toast.success(`New invite code generated: ${code}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to generate code.');
    }
  };

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied to clipboard.');
  };

  const handleRevoke = async (code: string) => {
    try {
      await revokeCode.mutateAsync(code);
      toast.success('Invite code revoked.');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to revoke code.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {codes?.filter((c) => !c.used).length ?? 0} unused code{(codes?.filter((c) => !c.used).length ?? 0) !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleGenerate}
          disabled={generateCode.isPending}
          className="gap-1.5"
        >
          {generateCode.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Generate Code
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      )}

      {!isLoading && (!codes || codes.length === 0) && (
        <p className="text-sm text-muted-foreground py-4">No invite codes yet.</p>
      )}

      {!isLoading && codes && codes.length > 0 && (
        <div className="space-y-2">
          {codes.map((ic) => (
            <div
              key={ic.code}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-xs font-mono text-foreground truncate">{ic.code}</code>
                <Badge variant={ic.used ? 'secondary' : 'outline'} className="text-xs shrink-0">
                  {ic.used ? 'Used' : 'Available'}
                </Badge>
              </div>
              {!ic.used && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCopy(ic.code)}
                    title="Copy invite link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(ic.code)}
                    disabled={revokeCode.isPending}
                    title="Revoke code"
                  >
                    {revokeCode.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
