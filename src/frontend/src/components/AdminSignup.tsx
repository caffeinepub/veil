import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Region, RegistrationError } from "../backend";
import { useGenerateInviteCode, useRegister } from "../hooks/useQueries";

export default function AdminSignup() {
  const [pseudonym, setPseudonym] = useState("");
  const [region, setRegion] = useState<Region>(Region.Global);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"generate" | "register">("generate");

  const generateInviteCode = useGenerateInviteCode();
  const register = useRegister();

  const handleGenerateCode = async () => {
    try {
      const code = await generateInviteCode.mutateAsync();
      setGeneratedCode(code);
      setStep("register");
      toast.success("Invite code generated.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to generate invite code.",
      );
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedCode) return;
    if (!pseudonym.trim()) {
      toast.error("Please enter a pseudonym.");
      return;
    }

    try {
      const result = await register.mutateAsync({
        pseudonym: pseudonym.trim(),
        region,
        inviteCode: generatedCode,
      });

      if (result.__kind__ === "ok") {
        toast.success(`Member "${pseudonym}" registered successfully.`);
        setPseudonym("");
        setGeneratedCode(null);
        setStep("generate");
      } else {
        const errMap: Record<RegistrationError, string> = {
          [RegistrationError.AnonymousNotAllowed]: "Not logged in.",
          [RegistrationError.CapacityReached]: "Community is full.",
          [RegistrationError.AlreadyRegistered]: "Already registered.",
          [RegistrationError.InvalidInviteCode]: "Invalid invite code.",
          [RegistrationError.InviteCodeUsed]: "Invite code already used.",
        };
        toast.error(errMap[result.err] ?? "Registration failed.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Registration failed.");
    }
  };

  return (
    <Card className="rounded-xl shadow-card border border-border max-w-md">
      <CardHeader>
        <CardTitle className="text-base">Add New Member</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "generate" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate an invite code first, then register the new member.
            </p>
            <Button
              onClick={handleGenerateCode}
              disabled={generateInviteCode.isPending}
              variant="outline"
              className="w-full"
            >
              {generateInviteCode.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Invite Code
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {generatedCode && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <code className="flex-1 text-xs font-mono">
                  {generatedCode}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-6 w-6 shrink-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-pseudonym">Pseudonym</Label>
              <Input
                id="admin-pseudonym"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                placeholder="e.g. quietstorm"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-region">Region</Label>
              <Select
                value={region}
                onValueChange={(v) => setRegion(v as Region)}
              >
                <SelectTrigger id="admin-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Region.Global}>Global</SelectItem>
                  <SelectItem value={Region.India}>India</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("generate");
                  setGeneratedCode(null);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={register.isPending}
                className="flex-1"
              >
                {register.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Register Member
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
