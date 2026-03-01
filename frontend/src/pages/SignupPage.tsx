import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useRegister, useGetSeatInfo } from '../hooks/useQueries';
import { Region } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Lock, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const { data: seatInfo, isLoading: seatLoading } = useGetSeatInfo();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [region, setRegion] = useState<Region>(Region.Global);
  const [inviteCode, setInviteCode] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    inviteCode?: string;
  }>({});
  const [submitError, setSubmitError] = useState('');

  // Pre-fill invite code from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code') || params.get('invite');
    if (codeFromUrl) setInviteCode(codeFromUrl);
  }, []);

  const currentSeats = seatInfo ? Number(seatInfo.currentSeats) : 0;
  const maxSeats = seatInfo ? Number(seatInfo.maxSeats) : 100;
  const isFull = !seatLoading && currentSeats >= maxSeats;
  const fillPercent = Math.min((currentSeats / maxSeats) * 100, 100);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!displayName.trim()) errors.displayName = 'Display name is required.';
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = 'Please enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!inviteCode.trim()) errors.inviteCode = 'An invite code is required to register.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    try {
      // Backend register uses pseudonym (displayName) + region + inviteCode
      await register.mutateAsync({
        pseudonym: displayName.trim(),
        region,
        inviteCode: inviteCode.trim(),
      });
      // After successful registration → redirect to login
      navigate({ to: '/login' });
    } catch (err: any) {
      const msg = err?.message ?? 'Registration failed.';
      if (msg.includes('InviteCodeUsed')) {
        setFieldErrors((p) => ({ ...p, inviteCode: 'This invite code has already been used.' }));
      } else if (msg.includes('InvalidInviteCode')) {
        setFieldErrors((p) => ({
          ...p,
          inviteCode: 'Invalid invite code. Please check and try again.',
        }));
      } else if (msg.includes('CapacityReached')) {
        setSubmitError('Registration is closed — all 100 seats are filled.');
      } else if (msg.includes('AlreadyRegistered')) {
        setSubmitError('You are already registered. Please sign in.');
      } else {
        setSubmitError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Seat Indicator */}
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            {seatLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Users className="w-4 h-4" />
                    Membership seats
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      isFull ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {currentSeats} / {maxSeats} seats filled
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isFull ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                {isFull && (
                  <p className="text-xs text-destructive mt-1">All seats are currently filled.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Form or Capacity Message */}
        {isFull ? (
          <Card className="border-border/60">
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Registration Closed</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No seats available. Registration is currently at capacity (100/100).
                <br />
                Please check back later.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigate({ to: '/login' })}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif">Create your account</CardTitle>
              <CardDescription>
                Veil is invite-only. You need a valid invite code to register.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Display Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">
                    Anonymous Display Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Choose an anonymous name"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (fieldErrors.displayName)
                        setFieldErrors((p) => ({ ...p, displayName: undefined }));
                    }}
                    disabled={register.isPending}
                    autoComplete="off"
                  />
                  {fieldErrors.displayName && (
                    <p className="text-xs text-destructive">{fieldErrors.displayName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email)
                        setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    disabled={register.isPending}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password)
                          setFieldErrors((p) => ({ ...p, password: undefined }));
                      }}
                      disabled={register.isPending}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Invite Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="inviteCode">
                    Invite Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your invite code"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      if (fieldErrors.inviteCode)
                        setFieldErrors((p) => ({ ...p, inviteCode: undefined }));
                    }}
                    disabled={register.isPending}
                    autoComplete="off"
                  />
                  {fieldErrors.inviteCode && (
                    <p className="text-xs text-destructive">{fieldErrors.inviteCode}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Invite codes are issued by the Veil admin only.
                  </p>
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <Label>Region</Label>
                  <RadioGroup
                    value={region}
                    onValueChange={(v) => setRegion(v as Region)}
                    className="flex gap-4"
                    disabled={register.isPending}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={Region.Global} id="global" />
                      <Label htmlFor="global" className="cursor-pointer font-normal">
                        Global
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={Region.India} id="india" />
                      <Label htmlFor="india" className="cursor-pointer font-normal">
                        India
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={register.isPending || seatLoading}
                >
                  {register.isPending ? 'Creating account…' : 'Create Account'}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="underline hover:text-foreground transition-colors"
                    onClick={() => navigate({ to: '/login' })}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
