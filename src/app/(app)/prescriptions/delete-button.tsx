"use client";

import { useRouter } from "next/navigation";
import { deletePrescription } from "@/lib/actions/prescriptions";
import { ConfirmButton } from "@/components/ui";

export function DeletePrescriptionButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete"
      confirmLabel="Confirm delete"
      onConfirm={async () => {
        await deletePrescription(id);
        router.refresh();
      }}
    />
  );
}
