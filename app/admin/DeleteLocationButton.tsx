"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteLocationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-red-600 hover:underline text-xs disabled:opacity-50"
      onClick={() => {
        if (!confirm("Delete this location? This cannot be undone.")) return;
        start(async () => {
          const r = await fetch(`/api/admin/locations/${id}`, {
            method: "DELETE",
          });
          if (r.ok) {
            router.refresh();
            return;
          }
          const err = await r.json().catch(() => ({}));
          alert(err.error ?? "Delete failed");
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
