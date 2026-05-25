"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  campusBoundaryLatLng,
  campusCenter,
} from "@/lib/mapConfig";
import { readGpsFromImageFile } from "@/lib/exif";
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
  const [exifNote, setExifNote] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const canPublish = !!file && coords != null;

  async function onFileChange(next: File | null) {
    setFile(next);
    setExifNote(null);
    if (!next) return;

    const gps = await readGpsFromImageFile(next);
    if (gps) {
      setCoords(gps);
      setMapKey((k) => k + 1);
      setExifNote(
        "GPS from photo applied — drag the pin on the map to fine-tune if needed.",
      );
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      return setError("Title is required.");
    }

    if (file) {
      if (!coords) return setError("Click on the map to set the location.");
      if (publish && !canPublish) {
        return setError("Publish requires a photo and map pin.");
      }
    }

    setPending(true);
    try {
      let body: Record<string, unknown> = {
        difficulty,
        title: title.trim(),
        hint: hint || null,
        is_published: file ? publish : false,
      };

      if (file) {
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

        body = {
          ...body,
          image_path: path,
          lat: coords!.lat,
          lng: coords!.lng,
        };
      }

      const create = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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
      <p className="text-sm text-muted">
        Save a draft with just a name and difficulty, or add a photo now. iPhone
        photos with location enabled auto-fill GPS on the map.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="label">Title</span>
          <input
            type="text"
            maxLength={120}
            required
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
        <span className="label">Photo (optional for draft)</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-niner-green file:mr-4 file:rounded file:border-0 file:bg-niner-green file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-niner-white hover:file:opacity-90"
        />
      </label>

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

      {exifNote && (
        <p className="text-sm text-niner-green">{exifNote}</p>
      )}

      {file && (
        <div>
          <div className="label mb-1">Click the map to set the location</div>
          <div className="h-64 sm:h-80 rounded overflow-hidden border border-niner-green/25">
            <AdminPickerMap
              key={mapKey}
              center={coords ?? campusCenter}
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
      )}

      {file && (
        <label className="inline-flex items-center gap-2 text-niner-green">
          <input
            type="checkbox"
            checked={publish}
            disabled={!canPublish}
            onChange={(e) => setPublish(e.target.checked)}
            className="accent-niner-green disabled:opacity-40"
          />
          <span className="text-sm">
            Publish immediately{!canPublish ? " (set map pin first)" : ""}
          </span>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : file ? "Save location" : "Save draft"}
      </button>
    </form>
  );
}
