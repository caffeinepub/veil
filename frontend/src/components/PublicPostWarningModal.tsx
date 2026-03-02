import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PublicPostWarningModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function PublicPostWarningModal({ open, onAcknowledge }: PublicPostWarningModalProps) {
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
            Sharing with the community
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Public posts are witnessed by a small, private circle. Your pseudonym is not shown,
            but your words are visible to all members. Take a moment before sharing.
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
