import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAdminGenerateInviteCode, useAdminRegister } from '../hooks/useQueries';
import { Region } from '../backend';

export default function AdminSignup() {
  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.India);
  const [successMessage, setSuccessMessage] = useState('');

  const generateCode = useAdminGenerateInviteCode();
  const adminRegister = useAdminRegister();

  const isPending = generateCode.isPending || adminRegister.isPending;
  const error = generateCode.error || adminRegister.error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    try {
      // Generate a fresh invite code, then register with it
      const inviteCode = await generateCode.mutateAsync();
      await adminRegister.mutateAsync({ pseudonym: pseudonym.trim(), region, inviteCode });
      setSuccessMessage('Account created successfully.');
      setPseudonym('');
      setRegion(Region.India);
    } catch {
      // error shown via error state
    }
  };

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'
    : null;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-lg">Create Account (Admin)</CardTitle>
        <CardDescription className="text-sm">
          Register a new member account. An invite code will be generated and used automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="admin-pseudonym">Pseudonym</Label>
            <Input
              id="admin-pseudonym"
              type="text"
              placeholder="Enter a pseudonym"
              value={pseudonym}
              onChange={(e) => {
                setPseudonym(e.target.value);
                if (successMessage) setSuccessMessage('');
              }}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <RadioGroup
              value={region}
              onValueChange={(val) => setRegion(val as Region)}
              className="flex gap-6"
              disabled={isPending}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value={Region.India} id="admin-region-india" />
                <Label htmlFor="admin-region-india" className="cursor-pointer font-normal">
                  India
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value={Region.Global} id="admin-region-global" />
                <Label htmlFor="admin-region-global" className="cursor-pointer font-normal">
                  Global
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            disabled={isPending || !pseudonym.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin mr-2" />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 size={15} />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
