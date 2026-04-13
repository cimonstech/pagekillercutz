"use client";

import Image from "next/image";
import { CalendarDays, CheckCircle2, Clock3, FileAudio, ImagePlus, Music2, Plus, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AlbumTrack, Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatDuration } from "@/lib/player-utils";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type MusicType = MusicRow["type"];
type TrackFormRow = {
  title: string;
  duration: string;
  durationSeconds: number | null;
  audioFile: File | null;
  audioUrl: string | null;
  uploading: boolean;
  uploadProgress: number;
};
const GENRE_OPTIONS = [
  "Afrobeats",
  "Highlife",
  "Amapiano",
  "Hip-Hop",
  "R&B",
  "Trap",
  "House",
  "Afro-soul",
  "Dancehall",
  "Reggae",
  "Gospel",
  "Old School",
  "Jazz",
  "Electronic",
  "Drill",
  "Pop",
  "Scratch",
  "Other",
] as const;

export default function MusicTab() {
  const { showToast, ToastComponent } = useAdminToast();
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    description: "",
    releaseDate: "",
    releaseType: "album" as MusicType,
    featured: false,
  });
  const [tracks, setTracks] = useState<TrackFormRow[]>([
    { title: "", duration: "", durationSeconds: null, audioFile: null, audioUrl: null, uploading: false, uploadProgress: 0 },
  ]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishError, setPublishError] = useState("");
  const [coverDragOver, setCoverDragOver] = useState(false);
  const [audioDragOver, setAudioDragOver] = useState(false);
  const [primaryGenre, setPrimaryGenre] = useState("");
  const [secondaryGenre, setSecondaryGenre] = useState("");
  const titleInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const trackFileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [libTab, setLibTab] = useState("All");
  const [music, setMusic] = useState<MusicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);
  const [existingAudio, setExistingAudio] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/music?all=true")
      .then((r) => r.json())
      .then((d: { music?: MusicRow[] }) => {
        setMusic(d.music || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const activeType = formData.releaseType;

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseDuration = (value: string): number => {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    if (trimmed.includes(":")) {
      const [m, s] = trimmed.split(":").map((n) => Number(n));
      if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s;
    }
    return Number(trimmed) || 0;
  };
  const detectDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.onloadedmetadata = () => {
        const s = Math.round(audio.duration);
        URL.revokeObjectURL(url);
        resolve(s);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
    });

  const truncateGenre = (genre: string) => {
    if (!genre) return "";
    if (genre.length <= 24) return genre;
    return `${genre.slice(0, 24)}...`;
  };

  const releaseTypeHint =
    activeType === "album"
      ? "Multiple tracks with individual titles and durations. Upload one combined audio file or leave audio empty."
      : activeType === "single"
        ? "One track. Upload the audio file for this single."
        : "A continuous DJ mix. Upload the full mix audio file.";

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      genre: "",
      description: "",
      releaseDate: "",
      releaseType: "album",
      featured: false,
    });
    setPrimaryGenre("");
    setSecondaryGenre("");
    setCoverFile(null);
    setCoverPreview(null);
    setAudioFile(null);
    setAudioName(null);
    setDetectedDuration(null);
    setExistingCover(null);
    setExistingAudio(null);
    setTracks([{ title: "", duration: "", durationSeconds: null, audioFile: null, audioUrl: null, uploading: false, uploadProgress: 0 }]);
    setPublishError("");
    setPublishStatus("");
  };

  const startEdit = (m: MusicRow) => {
    setEditingId(m.id);
    setFormData({
      title: m.title,
      genre: m.genre ?? "",
      description: m.description ?? "",
      releaseDate: m.release_date?.slice(0, 10) ?? "",
      releaseType: m.type,
      featured: m.featured,
    });
    const rawGenre = m.genre ?? "";
    if (!rawGenre) {
      setPrimaryGenre("");
      setSecondaryGenre("");
    } else if (rawGenre.includes("/")) {
      const [primary, secondary] = rawGenre.split("/").map((part) => part.trim());
      setPrimaryGenre(primary);
      setSecondaryGenre(secondary ?? "");
    } else {
      setPrimaryGenre(rawGenre);
      setSecondaryGenre("");
    }
    setExistingCover(m.cover_url);
    setExistingAudio(m.audio_url);
    const tr = m.tracks;
    if (tr && tr.length) {
      setTracks(
        tr.map((t) => ({
          title: t.title,
          duration: formatDuration(t.duration),
          durationSeconds: t.duration ?? null,
          audioFile: null,
          audioUrl: t.audio_url ?? null,
          uploading: false,
          uploadProgress: 0,
        })),
      );
    } else {
      setTracks([
        {
          title: m.title,
          duration: formatDuration(m.duration),
          durationSeconds: m.duration ?? null,
          audioFile: null,
          audioUrl: m.audio_url ?? null,
          uploading: false,
          uploadProgress: 0,
        },
      ]);
    }
  };

  const uploadFile = async (path: "/api/upload/music-cover", file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(path, { method: "POST", body: fd });
    const j = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !j.url) throw new Error(j.error || "upload failed");
    return j.url;
  };
  const uploadAudioFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/music-audio", { method: "POST", body: fd });
    const j = (await res.json()) as { url?: string; error?: string; duration?: number | null };
    if (!res.ok || !j.url) throw new Error(j.error || "upload failed");
    return { url: j.url, duration: typeof j.duration === "number" ? j.duration : null };
  };

  const handleCoverSelect = (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPublishError("Cover image must be JPG, PNG, or WebP.");
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setPublishError("");
  };

  const handleAudioSelect = (file: File | null) => {
    if (!file) return;
    const ok = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp4", "audio/x-m4a"].includes(file.type) || /\.(mp3|wav|flac|m4a)$/i.test(file.name);
    if (!ok) {
      setPublishError("Audio file must be MP3, WAV, FLAC, or M4A.");
      return;
    }
    setAudioFile(file);
    setAudioName(file.name);
    setPublishError("");
    void detectDuration(file).then((seconds) => setDetectedDuration(seconds > 0 ? seconds : null));
  };

  const handleTrackAudioSelect = async (file: File | null, trackIndex: number) => {
    if (!file) return;
    const ok =
      ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp4", "audio/x-m4a"].includes(file.type) ||
      /\.(mp3|wav|flac|m4a)$/i.test(file.name);
    if (!ok) {
      setPublishError("Track audio must be MP3, WAV, FLAC, or M4A.");
      return;
    }
    const durSeconds = await detectDuration(file);
    const dur = formatDuration(durSeconds);
    setTracks((prev) =>
      prev.map((t, i) =>
        i === trackIndex
          ? {
              ...t,
              audioFile: file,
              duration: dur,
              durationSeconds: durSeconds > 0 ? durSeconds : null,
              audioUrl: null,
              uploadProgress: 0,
              uploading: false,
            }
          : t,
      ),
    );
  };
  const clearTrackAudio = (trackIndex: number) => {
    setTracks((prev) =>
      prev.map((t, i) =>
        i === trackIndex
          ? {
              ...t,
              audioFile: null,
              audioUrl: null,
              duration: "",
              durationSeconds: null,
              uploading: false,
              uploadProgress: 0,
            }
          : t,
      ),
    );
  };
  const uploadTrackAudio = async (file: File, trackIndex: number): Promise<{ url: string; duration: number | null }> => {
    setTracks((prev) =>
      prev.map((t, i) => (i === trackIndex ? { ...t, uploading: true, uploadProgress: 0 } : t)),
    );
    const form = new FormData();
    form.append("file", file);
    const uploaded = await new Promise<{ url: string; duration: number | null }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        setTracks((prev) =>
          prev.map((t, i) => (i === trackIndex ? { ...t, uploadProgress: pct } : t)),
        );
      });
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as { url?: string; error?: string; duration?: number | null };
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            resolve({ url: data.url, duration: typeof data.duration === "number" ? data.duration : null });
          }
          else reject(new Error(data.error || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.open("POST", "/api/upload/music-audio");
      xhr.send(form);
    });
    setTracks((prev) =>
      prev.map((t, i) =>
        i === trackIndex
          ? {
              ...t,
              uploading: false,
              audioUrl: uploaded.url,
              uploadProgress: 100,
              duration: uploaded.duration ? formatDuration(uploaded.duration) : t.duration,
              durationSeconds: uploaded.duration ?? t.durationSeconds,
            }
          : t,
      ),
    );
    return uploaded;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPublishing(true);
    setPublishError("");
    setPublishStatus("Preparing upload...");

    try {
      if (!primaryGenre) {
        throw new Error("Please select a primary genre.");
      }
      const combinedGenre = secondaryGenre.trim() ? `${primaryGenre} / ${secondaryGenre.trim()}` : primaryGenre;
      let cover_url = existingCover;
      let audio_url = existingAudio;
      if (coverFile) {
        setPublishStatus("Uploading cover...");
        cover_url = await uploadFile("/api/upload/music-cover", coverFile);
      }
      if (audioFile) {
        setPublishStatus("Uploading main audio...");
        const audioData = await uploadAudioFile(audioFile);
        audio_url = audioData.url;
        if (audioData.duration && audioData.duration > 0) setDetectedDuration(audioData.duration);
      }

      let releaseTracks: AlbumTrack[] | null = null;
      let duration: number | null = null;
      if (activeType === "album") {
        const uploadTargets = tracks
          .map((row, idx) => ({ row, idx }))
          .filter(({ row }) => row.audioFile);
        const uploadedByIndex: Record<number, { url: string; duration: number | null }> = {};
        for (let i = 0; i < uploadTargets.length; i += 1) {
          const target = uploadTargets[i];
          if (!target?.row.audioFile) continue;
          setPublishStatus(`Uploading track ${i + 1}/${uploadTargets.length}...`);
          uploadedByIndex[target.idx] = await uploadTrackAudio(target.row.audioFile, target.idx);
        }
        releaseTracks = tracks
          .map((row, idx) => ({
            ...row,
            audioUrl: uploadedByIndex[idx]?.url ?? row.audioUrl,
            duration: uploadedByIndex[idx]?.duration ? formatDuration(uploadedByIndex[idx]?.duration) : row.duration,
          }))
          .filter((r) => r.title.trim())
          .map((r) => ({
            title: r.title.trim(),
            duration: parseDuration(r.duration),
            duration_seconds: r.durationSeconds ?? null,
            audio_url: r.audioUrl ?? null,
          }));
        duration = detectedDuration && detectedDuration > 0 ? detectedDuration : releaseTracks[0]?.duration ?? null;
      } else {
        duration = detectedDuration && detectedDuration > 0 ? detectedDuration : null;
        releaseTracks = [
          {
            title: formData.title.trim(),
            duration: duration ?? 0,
            audio_url: audio_url ?? undefined,
          },
        ];
      }

      const prevFeatured = editingId ? music.find((x) => x.id === editingId)?.featured : false;
      const payload = {
        title: formData.title.trim(),
        type: activeType,
        genre: combinedGenre,
        description: formData.description.trim() || null,
        release_date: formData.releaseDate || null,
        featured: editingId ? (prevFeatured ?? false) : formData.featured,
        cover_url: cover_url ?? null,
        audio_url: audio_url ?? null,
        duration,
        tracks: releaseTracks,
      };

      setPublishStatus("Saving release...");
      const url = editingId ? `/api/music/${editingId}` : "/api/music";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { music: MusicRow };
      if (editingId) {
        setMusic((prev) => prev.map((x) => (x.id === json.music.id ? json.music : x)));
        writeAuditLog("system", `Updated music ${json.music.title}`, json.music.id);
        showToast("Release updated.");
      } else {
        setMusic((prev) => [json.music, ...prev]);
        writeAuditLog("system", `Published music ${json.music.title}`, json.music.id);
        showToast("Release published.");
      }
      setPublishStatus("Published!");
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      setPublishError(message);
      showToast(message, "error");
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishStatus(""), 1500);
    }
  };

  const handleToggleFeatured = async (release: MusicRow) => {
    const newFeatured = !release.featured;
    const previous = music;
    setMusic((prev) =>
      prev.map((r) =>
        r.id === release.id ? { ...r, featured: newFeatured } : newFeatured ? { ...r, featured: false } : r,
      ),
    );
    try {
      if (newFeatured) {
        const unfeatureRes = await fetch("/api/music/unfeature-all", { method: "POST" });
        if (!unfeatureRes.ok) throw new Error();
      }
      const res = await fetch(`/api/music/${release.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: newFeatured }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { music: MusicRow };
      setMusic((prev) => prev.map((x) => (x.id === release.id ? json.music : x)));
      writeAuditLog(
        "music",
        newFeatured ? `Set "${release.title}" as featured` : `Removed "${release.title}" from featured`,
        release.id,
      );
      showToast(
        newFeatured
          ? `"${release.title}" is now featured on the homepage.`
          : `"${release.title}" removed from featured.`,
      );
    } catch {
      setMusic(previous);
      showToast("Failed.", "error");
    }
  };

  const remove = async (m: MusicRow) => {
    if (!confirm(`Delete “${m.title}”?`)) return;
    try {
      const res = await fetch(`/api/music/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMusic((prev) => prev.filter((x) => x.id !== m.id));
      writeAuditLog("system", `Deleted music ${m.title}`, m.id);
      showToast("Deleted.");
    } catch {
      showToast("Delete failed.", "error");
    }
  };

  const filteredLib = music.filter((m) => {
    if (libTab === "All") return true;
    if (libTab === "Albums") return m.type === "album";
    if (libTab === "Singles") return m.type === "single";
    if (libTab === "Mixes") return m.type === "mix";
    return true;
  });

  const releaseTypeTabs = useMemo(
    () => [
      { label: "ALBUM", value: "album" as MusicType },
      { label: "SINGLE", value: "single" as MusicType },
      { label: "MIX", value: "mix" as MusicType },
    ],
    [],
  );

  return (
    <main className="min-h-screen p-10">
      <ToastComponent />
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-headline font-semibold text-white leading-none">Music Library</h1>
          <p className="text-on-surface-variant text-sm mt-2">Manage catalogs, release schedules, and multi-format uploads.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <section className="w-full lg:w-[55%] space-y-8">
          <div className="glass rounded-sm border border-white/5 p-8">
            <h2 className="text-xl font-headline text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              {editingId ? "Edit Release" : "Upload New Release"}
            </h2>
            <form className="space-y-6" onSubmit={submit}>
              <div className="flex border-b border-white/10">
                {releaseTypeTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, releaseType: tab.value }))}
                    className={`-mb-px px-4 py-3 text-[11px] font-bold tracking-widest ${
                      activeType === tab.value
                        ? "border-b-2 border-primary text-white"
                        : "text-on-surface-variant hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p className="italic text-[12px] text-[#5A6080]">{releaseTypeHint}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Release Title</label>
                  <input
                    required
                    className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm p-3 text-white"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Primary genre</label>
                    <select
                      required
                      className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm p-3 text-white"
                      value={primaryGenre}
                      onChange={(e) => setPrimaryGenre(e.target.value)}
                    >
                      <option value="">Select primary genre</option>
                      {GENRE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Secondary genre</label>
                    <input
                      className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm p-3 text-white"
                      value={secondaryGenre}
                      placeholder="Add sub-genre (optional)"
                      onChange={(e) => setSecondaryGenre(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Description</label>
                <textarea
                  className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm p-3 text-white min-h-[72px]"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Release date</label>
                <div className="relative">
                  <input
                    type="date"
                    className="h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-3.5 pr-9 text-sm text-white outline-none focus:border-[#00BFFF]"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, releaseDate: e.target.value }))}
                  />
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#5A6080]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setCoverDragOver(true);
                  }}
                  onDragLeave={() => setCoverDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setCoverDragOver(false);
                    handleCoverSelect(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`relative h-[170px] border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group ${
                    coverDragOver ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleCoverSelect(e.target.files?.[0] ?? null)}
                  />
                  {coverPreview || existingCover ? (
                    <>
                      <Image src={coverPreview || existingCover || ""} alt="" fill className="object-cover rounded-sm" unoptimized />
                      <span className="absolute right-2 top-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white">Change</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-7 text-[#00BFFF]" />
                      <p className="text-sm font-semibold text-white">Upload Cover Image</p>
                      <p className="text-[12px] text-[#5A6080]">JPG, PNG or WebP · Max 10MB</p>
                      <p className="text-[11px] text-[#5A6080]">Recommended: 1000×1000px square</p>
                    </>
                  )}
                </label>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setAudioDragOver(true);
                  }}
                  onDragLeave={() => setAudioDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAudioDragOver(false);
                    handleAudioSelect(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`h-[170px] border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group p-4 ${
                    audioDragOver ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/50"
                  }`}
                >
                  <input type="file" accept=".mp3,.wav,.flac,.m4a,audio/*" className="hidden" onChange={(e) => handleAudioSelect(e.target.files?.[0] ?? null)} />
                  {audioFile ? (
                    <div className="w-full rounded-sm border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Music2 className="size-4 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white">{audioName}</p>
                            <p className="text-[10px] text-on-surface-variant">{formatSize(audioFile.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1 text-on-surface-variant hover:text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            setAudioFile(null);
                            setAudioName(null);
                            setDetectedDuration(null);
                          }}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileAudio className="size-7 text-[#F5A623]" />
                      <p className="text-sm font-semibold text-white">
                        {activeType === "album"
                          ? "Upload Album Audio"
                          : activeType === "single"
                            ? "Upload Single Audio"
                            : "Upload Mix Audio"}
                      </p>
                      <p className="text-[12px] text-[#5A6080]">
                        {activeType === "album"
                          ? "Full album as a single MP3 or WAV file"
                          : activeType === "single"
                            ? "MP3 or WAV · Max 200MB"
                            : "Full mix as a single MP3 · Max 200MB"}
                      </p>
                      <p className="text-[12px] text-[#5A6080]">MP3, WAV, FLAC · Max 200MB</p>
                    </>
                  )}
                </label>
              </div>
              {detectedDuration && detectedDuration > 0 && activeType !== "album" ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <Clock3 className="size-3 text-[#00BFFF]" />
                  <p className="font-mono text-[11px] text-[#00BFFF]">Duration detected: {formatDuration(detectedDuration)}</p>
                </div>
              ) : null}

              {activeType === "album" && (
                <div className="bg-surface-container-lowest p-5 rounded-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#00BFFF]">TRACKLIST</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#5A6080]">
                        {tracks.length} track{tracks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-[#00BFFF]/25 bg-[#00BFFF]/8 px-3 py-1 text-[12px] font-medium text-[#00BFFF]"
                      onClick={() => {
                        setTracks((prev) => [
                          ...prev,
                          { title: "", duration: "", durationSeconds: null, audioFile: null, audioUrl: null, uploading: false, uploadProgress: 0 },
                        ]);
                        setTimeout(() => {
                          const idx = tracks.length;
                          titleInputRefs.current[idx]?.focus();
                        }, 0);
                      }}
                    >
                      <Plus className="size-3.5" />
                      Add Track
                    </button>
                  </div>
                  <div className="mb-1 grid grid-cols-[24px_1fr_200px_80px_32px] items-center gap-[10px] border-b border-white/6 pb-1.5">
                    <span className="font-mono text-[10px] text-[#5A6080]">#</span>
                    <span className="font-mono text-[10px] text-[#5A6080]">TITLE</span>
                    <span className="font-mono text-[10px] text-[#5A6080]">AUDIO</span>
                    <span className="text-right font-mono text-[10px] text-[#5A6080]">DURATION</span>
                    <span />
                  </div>
                  <div className="space-y-0">
                    {tracks.map((row, i) => (
                      <div key={i} className="grid grid-cols-[24px_1fr_200px_80px_32px] items-center gap-[10px] border-b border-white/4 py-2">
                        <span className="w-6 font-mono text-[13px] text-[#00BFFF]">{String(i + 1).padStart(2, "0")}</span>
                        <input
                          ref={(el) => {
                            titleInputRefs.current[i] = el;
                          }}
                          className="h-9 rounded-[10px] border border-transparent bg-white/5 px-3 text-[13px] text-white outline-none focus:border-[#00BFFF]"
                          placeholder="Track title"
                          value={row.title}
                          onChange={(e) =>
                            setTracks((prev) =>
                              prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                            )
                          }
                        />
                        <div>
                          <input
                            ref={(el) => {
                              trackFileInputRefs.current[i] = el;
                            }}
                            type="file"
                            accept=".mp3,.wav,.flac,.m4a,audio/*"
                            className="hidden"
                            onChange={(e) => void handleTrackAudioSelect(e.target.files?.[0] ?? null, i)}
                          />
                          {!row.audioFile && !row.audioUrl && !row.uploading ? (
                            <button
                              type="button"
                              onClick={() => trackFileInputRefs.current[i]?.click()}
                              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 text-[11px] text-[#5A6080] transition-colors hover:border-[#00BFFF] hover:text-[#00BFFF]"
                            >
                              <UploadCloud className="size-3" />
                              Upload MP3
                            </button>
                          ) : row.uploading ? (
                            <div className="space-y-1">
                              <div className="h-[3px] w-full rounded bg-white/10">
                                <div className="h-full rounded bg-[#00BFFF]" style={{ width: `${row.uploadProgress}%` }} />
                              </div>
                              <p className="font-mono text-[9px] text-[#5A6080]">{row.uploadProgress}%</p>
                            </div>
                          ) : row.audioUrl ? (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="size-3.5 text-[#22c55e]" />
                                <span className="font-mono text-[10px] text-[#22c55e]">Uploaded</span>
                              </div>
                              <button type="button" className="text-white/30 hover:text-[#FF4560]" onClick={() => clearTrackAudio(i)}>
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-[10px] text-white">
                                  {row.audioFile?.name ? `${row.audioFile.name.slice(0, 12)}${row.audioFile.name.length > 12 ? "..." : ""}` : "Selected"}
                                </p>
                                <p className="text-[10px] text-[#5A6080]">{row.audioFile ? formatSize(row.audioFile.size) : ""}</p>
                              </div>
                              <button type="button" className="text-white/30 hover:text-[#FF4560]" onClick={() => clearTrackAudio(i)}>
                                <X className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {row.audioFile ? (
                          <div className="h-9 w-20 rounded-[10px] border border-[#00BFFF]/35 bg-[#00BFFF]/10 px-2 text-center font-mono text-[13px] leading-9 text-[#7ad8ff]">
                            {row.duration || "--:--"}
                          </div>
                        ) : (
                          <span className="inline-block w-20 text-right font-mono text-[13px] text-[rgba(255,255,255,0.2)]">
                            --:--
                          </span>
                        )}
                        {tracks.length > 1 ? (
                          <button
                            type="button"
                            className="w-8 text-[rgba(255,255,255,0.25)] hover:text-[#FF4560]"
                            onClick={() => setTracks((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            <X className="size-4" />
                          </button>
                        ) : (
                          <span className="w-8" />
                        )}
                      </div>
                    ))}
                  </div>
                  {!tracks.length ? (
                    <p className="text-center text-[12px] text-[#5A6080]">Click Add Track to build your tracklist.</p>
                  ) : null}
                </div>
              )}

              {publishError ? (
                <div className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">{publishError}</div>
              ) : null}
              {publishStatus ? <p className="font-mono text-[11px] text-[#5A6080]">{publishStatus}</p> : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex-1 w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 font-bold uppercase tracking-widest text-sm rounded-sm disabled:opacity-50"
                >
                  {publishing ? "Publishing..." : editingId ? "Save changes" : "FINALIZE AND PUBLISH RELEASE"}
                </button>
                {editingId && (
                  <button type="button" className="px-4 py-4 text-xs uppercase text-on-surface-variant" onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        <section className="w-full lg:w-[45%] space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-headline text-white">Existing Releases</h2>
            <div className="flex gap-2 flex-wrap">
              {["All", "Albums", "Singles", "Mixes"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLibTab(t)}
                  className={`text-[10px] font-bold px-3 py-1 ${
                    libTab === t ? "text-primary border border-primary/20 bg-primary/5" : "text-on-surface-variant hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-on-surface-variant text-sm">Loading…</p>
            ) : (
              filteredLib.map((m) => (
                <div
                  key={m.id}
                  className="group relative flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container-highest transition-all duration-300"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/6">
                    {m.cover_url && (m.cover_url.startsWith("https://") || m.cover_url.startsWith("http://")) ? (
                      <Image
                        src={m.cover_url}
                        alt={m.title}
                        width={56}
                        height={56}
                        unoptimized
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[rgba(0,191,255,0.08)]">
                        <Music2 className="size-5 text-[#00BFFF]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-primary/20 text-primary rounded-[2px] tracking-tighter">
                        {m.type}
                      </span>
                      <h4 className="text-sm font-semibold text-white truncate">{m.title}</h4>
                    </div>
                    <p className="text-[10px] text-on-surface-variant" title={m.genre ?? ""}>
                      {m.genre ? truncateGenre(m.genre) : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center rounded-sm ${
                        m.featured ? "bg-[#F5A623]/15 text-[#F5A623]" : "bg-white/5 text-[rgba(255,255,255,0.25)] hover:text-[#F5A623]"
                      }`}
                      title={m.featured ? "Remove from featured" : "Set as featured"}
                      onClick={() => void handleToggleFeatured(m)}
                    >
                      <span className="material-symbols-outlined text-lg">{m.featured ? "star" : "star_outline"}</span>
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-on-surface rounded-sm"
                      onClick={() => startEdit(m)}
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center bg-error/10 hover:bg-error/20 text-error rounded-sm"
                      onClick={() => void remove(m)}
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
