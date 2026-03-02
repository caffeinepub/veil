import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface PublicPostWarningModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function PublicPostWarningModal({ open, onAcknowledge }: PublicPostWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="rounded-2xl max-w-md shadow-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <div className="flex justify-center">
            <Globe className="h-10 w-10 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center font-serif text-xl">Sharing Publicly</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            You are about to share this entry with the entire VEIL community. While pseudonyms protect
            your identity, the content will be visible to all members. Please ensure you are comfortable
            with this before proceeding.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Button
            onClick={onAcknowledge}
            variant="secondary"
            className="w-full"
          >
            I understand — share publicly
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
