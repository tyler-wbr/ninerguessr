"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  campusBoundaryLatLng,
  campusCenter,
} from "@/lib/mapConfig";
import type { Difficulty } from "@/lib/supabase/types";

const AdminPickerMap = dynamic(
  () => import("@/components/Map/AdminPickerMap"),
  { ssr: false },
);

export default function NewLocationForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [publish, setPublish] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose an image file.");
    if (!coords) return setError("Click on the map to set the location.");
    setPending(true);
    try {
      const uploadRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!uploadRes.ok) throw new Error("Failed to get upload URL");
      const { path, signedUrl } = (await uploadRes.json()) as {
        path: string;
        signedUrl: string;
      };

      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      const create = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image_path: path,
          lat: coords.lat,
          lng: coords.lng,
          difficulty,
          title: title || null,
          hint: hint || null,
          is_published: publish,
        }),
      });
      if (!create.ok) {
        const err = await create.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create location");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="label">Photo</span>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-niner-green file:mr-4 file:rounded file:border-0 file:bg-niner-green file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-niner-white hover:file:opacity-90"
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="label">Title (optional)</span>
          <input
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="block">
          <span className="label">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="input-field"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Hint (optional)</span>
        <textarea
          maxLength={500}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="input-field"
          rows={2}
        />
      </label>

      <div>
        <div className="label mb-1">Click the map to set the location</div>
        <div className="h-80 rounded overflow-hidden border border-niner-green/25">
          <AdminPickerMap
            center={campusCenter}
            boundary={campusBoundaryLatLng}
            initial={coords}
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>
        <p className="mt-1 text-xs text-muted font-mono">
          {coords
            ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
            : "no point selected"}
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-niner-green">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="accent-niner-green"
        />
        <span className="text-sm">Publish immediately</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save location"}
      </button>
    </form>
  );
}
