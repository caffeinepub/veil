import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Region, RegistrationError } from "../backend";
import { useGetSeatInfo, useRegister } from "../hooks/useQueries";
import { getPersistedUrlParameter } from "../utils/urlParams";

// Password rules
interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { data: seatInfo } = useGetSeatInfo();
  const register = useRegister();

  const [pseudonym, setPseudonym] = useState("");
  const [region, setRegion] = useState<Region>(Region.Global);
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    // Try 'invite' param first (from invite link), then 'code' as fallback
    const code =
      getPersistedUrlParameter("invite") ?? getPersistedUrlParameter("code");
    if (code) setInviteCode(code);
  }, []);

  const seatsLeft = seatInfo
    ? Number(seatInfo.maxSeats) - Number(seatInfo.currentSeats)
    : null;

  const passwordRuleResults = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));

  const allPasswordRulesPassed = passwordRuleResults.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudonym.trim()) {
      toast.error("Please enter a pseudonym.");
      return;
    }
    if (!inviteCode.trim()) {
      toast.error("Please enter your invite code.");
      return;
    }
    if (!allPasswordRulesPassed) {
      toast.error("Password does not meet all requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const result = await register.mutateAsync({
        pseudonym: pseudonym.trim(),
        region,
        inviteCode: inviteCode.trim(),
      });

      if (result.__kind__ === "ok") {
        toast.success("Welcome to Veil. Your account has been created.");
        navigate({ to: "/dashboard" });
      } else {
        const errMap: Record<RegistrationError, string> = {
          [RegistrationError.AnonymousNotAllowed]:
            "Please log in before registering.",
          [RegistrationError.CapacityReached]:
            "Sorry, the community is currently full.",
          [RegistrationError.AlreadyRegistered]: "You are already registered.",
          [RegistrationError.InvalidInviteCode]: "Invalid invite code.",
          [RegistrationError.InviteCodeUsed]:
            "This invite code has already been used.",
        };
        toast.error(errMap[result.err] ?? "Registration failed.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Registration failed.");
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold">Join Veil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An invite-only space for honest expression.
          </p>
        </div>

        {seatsLeft !== null && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} remaining
            </span>
          </div>
        )}

        <Card className="rounded-xl shadow-card border border-border">
          <CardHeader>
            <CardTitle className="text-base">Create your account</CardTitle>
            <CardDescription>
              Your pseudonym keeps you anonymous within the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pseudonym */}
              <div className="space-y-2">
                <Label htmlFor="pseudonym">Pseudonym</Label>
                <Input
                  id="pseudonym"
                  data-ocid="signup.input"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  placeholder="e.g. quietstorm"
                  autoComplete="off"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-ocid="signup.password_input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordTouched(true);
                    }}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password strength checklist */}
                {passwordTouched && (
                  <ul className="mt-2 space-y-1">
                    {passwordRuleResults.map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          rule.passed
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {rule.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    data-ocid="signup.confirm_password_input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={`pr-10 ${
                      confirmPassword.length > 0 && !passwordsMatch
                        ? "border-destructive focus-visible:ring-destructive/30"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={region}
                  onValueChange={(v) => setRegion(v as Region)}
                >
                  <SelectTrigger id="region" data-ocid="signup.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Region.Global}>Global</SelectItem>
                    <SelectItem value={Region.India}>India</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invite Code */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter your invite code"
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                data-ocid="signup.submit_button"
                className="w-full"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
