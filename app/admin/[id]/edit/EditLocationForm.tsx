"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  campusBoundaryLatLng,
  campusCenter,
} from "@/lib/mapConfig";
import { readGpsFromImageFile } from "@/lib/exif";
import type { Difficulty, Location } from "@/lib/supabase/types";

const AdminPickerMap = dynamic(
  () => import("@/components/Map/AdminPickerMap"),
  { ssr: false },
);

type Props = {
  location: Location;
  photoUrl: string | null;
};

export default function EditLocationForm({ location, photoUrl }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(location.title ?? "");
  const [hint, setHint] = useState(location.hint ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(location.difficulty);
  const [publish, setPublish] = useState(location.is_published);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [exifNote, setExifNote] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const hasPhoto = !!location.image_path || !!file;
  const canPublish = hasPhoto && coords != null;

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

    if (file && !coords) {
      return setError("Click on the map to set the location.");
    }
    if (publish && !canPublish) {
      return setError("Publish requires a photo and map pin.");
    }

    setPending(true);
    try {
      let imagePath = location.image_path;

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
        imagePath = path;
      }

      const patch = await fetch(`/api/admin/locations/${location.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(imagePath ? { image_path: imagePath } : {}),
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
          difficulty,
          title: title || null,
          hint: hint || null,
          is_published: publish,
        }),
      });
      if (!patch.ok) {
        const err = await patch.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update location");
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="page-title">Edit location</h1>
        <Link href="/admin" className="text-sm text-niner-green hover:underline">
          Back
        </Link>
      </div>

      {!location.image_path && (
        <p className="text-sm text-muted">
          Draft — add a campus photo when you&apos;re on site. iPhone photos with
          location enabled will auto-fill GPS on the map.
        </p>
      )}

      {photoUrl && !file && (
        <div className="overflow-hidden rounded border border-niner-green/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={title || "Location photo"}
            className="max-h-48 w-full object-contain bg-niner-green/10"
          />
        </div>
      )}

      <label className="block">
        <span className="label">
          {location.image_path ? "Replace photo (optional)" : "Photo"}
        </span>
        <input
          type="file"
          accept="image/*"
          required={!location.image_path}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-niner-green file:mr-4 file:rounded file:border-0 file:bg-niner-green file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-niner-white hover:file:opacity-90"
        />
      </label>

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
        <span className="label">Hint (optional)</span>
        <textarea
          maxLength={500}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="input-field"
          rows={2}
        />
      </label>

      {exifNote && <p className="text-sm text-niner-green">{exifNote}</p>}

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

      <label className="inline-flex items-center gap-2 text-niner-green">
        <input
          type="checkbox"
          checked={publish}
          disabled={!canPublish}
          onChange={(e) => setPublish(e.target.checked)}
          className="accent-niner-green disabled:opacity-40"
        />
        <span className="text-sm">
          Publish{!canPublish ? " (add photo + pin first)" : ""}
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
