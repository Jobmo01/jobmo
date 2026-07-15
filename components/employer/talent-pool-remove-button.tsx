"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFromTalentPoolAction } from "@/app/dashboard/employer/talent-pool/actions";

export function TalentPoolRemoveButton({ id }: { id: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleRemove() {
    setIsSubmitting(true);
    const result = await removeFromTalentPoolAction(id);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Removed from talent pool");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Remove from talent pool" disabled={isSubmitting} onClick={handleRemove}>
      <X className="h-4 w-4" />
    </Button>
  );
}
