import { useState } from 'react';
import { useAdminGetInviteCodes, useAdminGenerateInviteCode, useAdminRevokeInviteCode } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

export default function AdminInviteCodes() {
  const { data: codes = [], isLoading } = useAdminGetInviteCodes();
  const generateCode = useAdminGenerateInviteCode();
  const revokeCode = useAdminRevokeInviteCode();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      await generateCode.mutateAsync();
      toast.success('Invite code generated.');
    } catch {
      toast.error('Could not generate code.');
    }
  };

  const handleCopy = async (code: string) => {
    const url = `${window.location.origin}/signup?invite=${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = async (code: string) => {
    setRevokingCode(code);
    try {
      await revokeCode.mutateAsync({ code });
      toast.success('Code revoked.');
    } catch {
      toast.error('Could not revoke code.');
    } finally {
      setRevokingCode(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={generateCode.isPending}
          className="text-sm px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:opacity-80 disabled:opacity-40"
        >
          {generateCode.isPending ? 'Generating…' : 'Generate code'}
        </button>
      </div>

      {codes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No invite codes yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {codes.map((ic) => (
            <div
              key={ic.code}
              className="bg-card rounded-xl border border-border shadow-soft p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <code className="text-xs font-mono text-foreground">{ic.code}</code>
                {ic.used && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    used
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!ic.used && (
                  <>
                    <button
                      onClick={() => handleCopy(ic.code)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy invite link"
                    >
                      {copiedCode === ic.code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleRevoke(ic.code)}
                      disabled={revokingCode === ic.code}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      {revokingCode === ic.code ? 'Revoking…' : 'Revoke'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
