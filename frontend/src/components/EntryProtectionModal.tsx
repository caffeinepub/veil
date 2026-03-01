import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';

interface EntryProtectionModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  isPending?: boolean;
}

export default function EntryProtectionModal({
  isOpen,
  onAcknowledge,
  isPending = false,
}: EntryProtectionModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        // Intentionally empty — modal can only be dismissed via the button
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-serif text-xl">A safe space</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-1 text-foreground/80">
            Veil is a private space for honesty and reflection. We protect vulnerability here. Use this space responsibly.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            onClick={onAcknowledge}
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait…
              </>
            ) : (
              'I Understand'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
