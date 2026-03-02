import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface EntryProtectionModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function EntryProtectionModal({ open, onAcknowledge }: EntryProtectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="rounded-2xl max-w-md shadow-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <div className="flex justify-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center font-serif text-xl">Before You Write</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            VEIL is a safe space for honest expression. Everything you write here is private by default.
            Please be kind to yourself and others. This is not a crisis service — if you are in immediate
            danger, please contact emergency services.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Button
            onClick={onAcknowledge}
            variant="secondary"
            className="w-full"
          >
            I understand — let me write
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
