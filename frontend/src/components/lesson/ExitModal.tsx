"use client";

import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** "Are you sure you want to quit?" guard on the lesson's close button. */
export function ExitModal({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal open={open} onClose={onStay} labelledBy="exit-modal-title">
      <div className="flex flex-col items-center text-center">
        <Mascot size={112} mood="sad" />
        <h2 id="exit-modal-title" className="mt-4 text-[23px] font-extrabold leading-8">
          Wait, don&apos;t go! You&apos;ll lose your progress if you quit now
        </h2>
        <Button variant="blue" fullWidth className="mt-8" onClick={onStay}>
          Keep learning
        </Button>
        <Button variant="ghost" fullWidth className="mt-2 !text-cardinal" onClick={onLeave}>
          End session
        </Button>
      </div>
    </Modal>
  );
}
