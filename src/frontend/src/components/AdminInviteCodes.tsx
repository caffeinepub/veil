import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Copy, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGenerateInviteCode,
  useGetInviteCodes,
  useRevokeInviteCode,
} from "../hooks/useQueries";

export default function AdminInviteCodes() {
  const { data: codes, isLoading } = useGetInviteCodes();
  const generateCode = useGenerateInviteCode();
  const revokeCode = useRevokeInviteCode();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      await generateCode.mutateAsync();
      toast.success("Invite code generated.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to generate invite code.",
      );
    }
  };

  const handleCopy = (code: string) => {
    const link = `${window.location.origin}/signup?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("Invite link copied.");
  };

  const handleRevoke = async (code: string) => {
    try {
      await revokeCode.mutateAsync(code);
      toast.success("Invite code revoked.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to revoke invite code.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={generateCode.isPending}
        className="text-xs"
      >
        {generateCode.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Plus className="h-3 w-3 mr-1" />
        )}
        Generate Code
      </Button>

      {!codes || codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invite codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((ic) => (
            <Card
              key={ic.code}
              className="rounded-xl shadow-card border border-border"
            >
              <CardContent className="py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-xs font-mono truncate">{ic.code}</code>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${
                      ic.used
                        ? "border-muted text-muted-foreground"
                        : "border-green-300 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {ic.used ? "Used" : "Available"}
                  </Badge>
                </div>
                {!ic.used && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(ic.code)}
                      className="h-7 w-7"
                    >
                      {copiedCode === ic.code ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(ic.code)}
                      disabled={revokeCode.isPending}
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      {revokeCode.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
