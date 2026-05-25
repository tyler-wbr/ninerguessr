"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function TogglePublishButton({
  id,
  isPublished,
  canPublish,
}: {
  id: string;
  isPublished: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!isPublished && !canPublish) {
          alert("Add a photo and map pin before publishing.");
          return;
        }
        start(async () => {
          const r = await fetch(`/api/admin/locations/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ is_published: !isPublished }),
          });
          if (r.ok) {
            router.refresh();
            return;
          }
          const err = await r.json().catch(() => ({}));
          alert(err.error ?? "Update failed");
        });
      }}
      className={`text-xs rounded px-2 py-1 disabled:opacity-50 ${
        isPublished
          ? "bg-niner-green/10 text-niner-green"
          : canPublish
            ? "bg-niner-gold/20 text-niner-green/70"
            : "bg-niner-green/5 text-muted"
      }`}
    >
      {pending ? "…" : isPublished ? "Published" : canPublish ? "Ready" : "Draft"}
    </button>
  );
}
