"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function TogglePublishButton({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const r = await fetch(`/api/admin/locations/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ is_published: !isPublished }),
          });
          if (r.ok) router.refresh();
          else alert("Update failed");
        });
      }}
      className={`text-xs rounded px-2 py-1 disabled:opacity-50 ${
        isPublished
          ? "bg-niner-green/10 text-niner-green"
          : "bg-niner-gold/20 text-niner-green/70"
      }`}
    >
      {pending ? "…" : isPublished ? "Published" : "Draft"}
    </button>
  );
}
