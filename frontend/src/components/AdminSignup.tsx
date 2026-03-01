import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAdminRegister } from '../hooks/useQueries';
import { Region } from '../backend';

export default function AdminSignup() {
  const [pseudonym, setPseudonym] = useState('');
  const [region, setRegion] = useState<Region>(Region.India);
  const [successMessage, setSuccessMessage] = useState('');

  const adminRegister = useAdminRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    adminRegister.mutate(
      { pseudonym: pseudonym.trim(), region },
      {
        onSuccess: () => {
          setSuccessMessage('Account created successfully.');
          setPseudonym('');
          setRegion(Region.India);
        },
      }
    );
  };

  const errorMessage = adminRegister.error
    ? adminRegister.error instanceof Error
      ? adminRegister.error.message
      : 'An unexpected error occurred.'
    : null;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-lg">Create Account (Admin Bypass)</CardTitle>
        <CardDescription className="text-sm">
          Register a new account without an invite code. The account will be created under your
          principal.
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
                if (adminRegister.isError) adminRegister.reset();
              }}
              disabled={adminRegister.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <RadioGroup
              value={region}
              onValueChange={(val) => setRegion(val as Region)}
              className="flex gap-6"
              disabled={adminRegister.isPending}
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
            disabled={adminRegister.isPending || !pseudonym.trim()}
            className="w-full"
          >
            {adminRegister.isPending ? (
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
