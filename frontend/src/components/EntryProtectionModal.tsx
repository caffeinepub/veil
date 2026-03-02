import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface EntryProtectionModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function EntryProtectionModal({ open, onAcknowledge }: EntryProtectionModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Non-dismissible
      }}
    >
      <DialogContent
        className="rounded-2xl bg-card border border-border shadow-soft-lg max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-3">
          <DialogTitle className="font-serif text-lg font-medium text-foreground">
            A private space
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Veil is a private space for honesty and reflection. What you write here is yours.
            Be gentle with yourself and others. This is not a crisis service — if you are in
            immediate danger, please contact emergency services.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <button
            onClick={onAcknowledge}
            className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80"
          >
            I understand
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
