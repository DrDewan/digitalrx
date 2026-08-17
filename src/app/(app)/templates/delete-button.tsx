"use client";

import { useRouter } from "next/navigation";
import { deleteTemplate } from "@/lib/actions/templates";
import { ConfirmButton } from "@/components/ui";

export function DeleteTemplateButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete"
      confirmLabel="Confirm delete"
      onConfirm={async () => {
        await deleteTemplate(id);
        router.refresh();
      }}
    />
  );
}
