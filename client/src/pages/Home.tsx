import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FileMusic,
  FileUp,
  FolderOpen,
  LockKeyhole,
  LibraryBig,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Music2,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";

type Song = inferRouterOutputs<AppRouter>["songs"]["list"][number];
type Category = "전체 악보" | "찬송가" | "CCM";
type FormState = { title: string; category: "찬송가" | "CCM"; slideCount: string };

type FilePayload = {
  fileName: string;
  mimeType: string;
  fileData: string;
  fileSize: number;
};

const categories: { label: Category; icon: typeof LibraryBig }[] = [
  { label: "전체 악보", icon: LibraryBig },
  { label: "찬송가", icon: BookOpen },
  { label: "CCM", icon: Music2 },
];

const colors = ["rose", "sage", "amber", "blue", "violet", "teal"];
const emptyForm: FormState = { title: "", category: "CCM", slideCount: "1" };

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="brand-note brand-note-one">♪</span>
      <span className="brand-note brand-note-two">♫</span>
      <span className="brand-stem" />
    </div>
  );
}

function AppLogo() {
  return (
    <div className="app-logo">
      <BrandMark />
      <div>
        <div className="logo-name">찬양창고</div>
        <div className="logo-subtitle">PRAISE ARCHIVE</div>
      </div>
    </div>
  );
}

function formatUpdated(date: Date | string | null | undefined) {
  if (!date) return "방금 전";
  const time = new Date(date).getTime();
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}일 전` : new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function MusicPaper({ song, compact = false }: { song: Song; compact?: boolean }) {
  return (
    <div className={`music-paper paper-${song.color} ${compact ? "music-paper-compact" : ""}`}>
      <div className="paper-topline"><span>{song.category}</span><span>찬양창고</span></div>
      <div className="paper-title">{song.title}</div>
      <div className="paper-subtitle">{song.slideCount} slides · praise archive</div>
      <div className="staff-area" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => <span className="staff-line" key={line} style={{ top: `${22 + line * 8}px` }} />)}
        <span className="paper-note note-a">♩</span><span className="paper-note note-b">♪</span><span className="paper-note note-c">♫</span><span className="paper-note note-d">♩</span>
      </div>
      <div className="paper-footer"><span>01</span><span>praise archive</span></div>
    </div>
  );
}

function FileTypeBadge({ song }: { song: Song }) {
  return <span className="file-type-badge"><FileMusic size={14} strokeWidth={2.1} /> {song.fileName ? song.fileName.split(".").pop()?.toUpperCase() : "PPTX"}</span>;
}

async function encodeFile(file: File): Promise<FilePayload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(index, Math.min(index + chunkSize, bytes.length))));
  }
  return { fileName: file.name, mimeType: file.type || "application/octet-stream", fileData: btoa(binary), fileSize: file.size };
}

function PresentationMode({ song, onClose }: { song: Song; onClose: () => void }) {
  const [slide, setSlide] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const totalSlides = Math.max(1, song.slideCount);
  const titles = [song.title, "Verse 01", "Chorus", "Bridge", "Ending"];
  const currentTitle = titles[slide - 1] ?? `${song.title} · ${slide}`;

  useEffect(() => {
    stageRef.current?.requestFullscreen?.().catch(() => undefined);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" || event.key === " ") setSlide((value) => Math.min(totalSlides, value + 1));
      if (event.key === "ArrowLeft") setSlide((value) => Math.max(1, value - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, totalSlides]);

  const closePresentation = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    onClose();
  };

  return (
    <div ref={stageRef} className="slideshow-overlay" role="dialog" aria-modal="true" aria-label={`${song.title} 슬라이드쇼`}>
      <div className="slideshow-topbar">
        <div className="slideshow-brand"><BrandMark /><span>{song.title}</span><span className="slideshow-divider">/</span><span className="slideshow-muted">{slide} / {totalSlides}</span></div>
        <button className="icon-button icon-button-dark" onClick={closePresentation} aria-label="슬라이드쇼 닫기"><X size={20} /></button>
      </div>
      <div className="slideshow-stage">
        <button className="slide-nav" onClick={() => setSlide((value) => Math.max(1, value - 1))} disabled={slide === 1} aria-label="이전 슬라이드"><ArrowLeft size={22} /></button>
        <div className="presentation-slide">
          <div className="presentation-kicker">찬양창고 · {song.category}</div>
          <h2>{currentTitle}</h2>
          <div className="presentation-line" />
          <div className="presentation-staff" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((line) => <span key={line} style={{ top: `${25 + line * 18}px` }} />)}
            <b>♩</b><i>♪</i><em>♫</em><strong>♩</strong>
          </div>
          <div className="presentation-lyrics">주님의 은혜 안에 오늘도 노래합니다</div>
          <div className="presentation-footer"><span>{song.category}</span><span>{String(slide).padStart(2, "0")}</span></div>
        </div>
        <button className="slide-nav" onClick={() => setSlide((value) => Math.min(totalSlides, value + 1))} disabled={slide === totalSlides} aria-label="다음 슬라이드"><ArrowRight size={22} /></button>
      </div>
      <div className="slideshow-controls">
        <div className="slide-dots">{Array.from({ length: totalSlides }).map((_, index) => <button key={index} className={`slide-dot ${slide === index + 1 ? "active" : ""}`} onClick={() => setSlide(index + 1)} aria-label={`${index + 1}번 슬라이드`} />)}</div>
        <span className="slideshow-hint">← → 또는 스페이스로 넘기기 · Esc로 나가기</span>
        {song.fileUrl && <a className="slideshow-download" href={song.fileUrl} download={song.fileName ?? `${song.title}.pptx`}><ArrowDownToLine size={16} /> 원본 PPT</a>}
      </div>
    </div>
  );
}

function AdminGate({ onClose, onUnlock }: { onClose: () => void; onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!password) {
      toast.error("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    onUnlock(password);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="upload-modal admin-modal" onSubmit={submit}>
        <div className="modal-header"><div><div className="section-kicker">ADMIN MODE</div><h2>관리자 모드</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="닫기"><X size={19} /></button></div>
        <div className="admin-lock-visual"><ShieldCheck size={26} /><span>관리자만 곡을 추가하거나 수정할 수 있어요.</span></div>
        <label className="admin-password-label">관리자 비밀번호<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" /></label>
        <div className="editor-note"><LockKeyhole size={15} /> 비밀번호는 이 화면에서만 잠시 사용되며 저장하지 않습니다.</div>
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>취소</button><button type="submit" className="save-button"><ShieldCheck size={16} /> 관리자 모드 시작</button></div>
      </form>
    </div>
  );
}

function SongEditor({
  song,
  onClose,
  onSubmit,
  saving,
}: {
  song: Song | null;
  onClose: () => void;
  onSubmit: (form: FormState, file: File | null) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => song ? { title: song.title, category: song.category === "찬송가" ? "찬송가" : "CCM", slideCount: String(song.slideCount) } : emptyForm);
  const [file, setFile] = useState<File | null>(null);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && !/\.(ppt|pptx|pdf)$/i.test(selected.name)) {
      toast.error("PPT, PPTX 또는 PDF 파일만 올릴 수 있어요.");
      return;
    }
    setFile(selected);
    if (selected && !form.title) setForm((current) => ({ ...current, title: selected.name.replace(/\.(pptx?|pdf)$/i, "").replace(/[_-]+/g, " ") }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("곡 이름을 입력해 주세요.");
      return;
    }
    onSubmit({ ...form, slideCount: String(Math.max(1, Number(form.slideCount) || 1)) }, file);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <form className="upload-modal editor-modal" onSubmit={submit}>
        <div className="modal-header"><div><div className="section-kicker">{song ? "EDIT SONG" : "ADD NEW SONG"}</div><h2>{song ? "곡 정보 수정" : "새 곡 추가"}</h2></div><button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="닫기"><X size={19} /></button></div>
        <div className="editor-fields">
          <label>곡 이름<input autoFocus value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="예: 은혜" /></label>
          <div className="field-grid"><label>분류<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as "찬송가" | "CCM" }))}><option value="CCM">CCM</option><option value="찬송가">찬송가</option></select></label><label>슬라이드 수<input type="number" min="1" max="999" value={form.slideCount} onChange={(event) => setForm((current) => ({ ...current, slideCount: event.target.value }))} /></label></div>
          <label className="file-picker-label">PPT 원본 파일<span className="file-picker"><FileUp size={19} /><span>{file?.name ?? song?.fileName ?? "PPT, PPTX 또는 PDF 선택"}</span><input type="file" accept=".ppt,.pptx,.pdf" onChange={chooseFile} /></span></label>
          <div className="editor-note"><Check size={15} /> 수정하면 다른 화면에도 3초 안에 자동으로 반영됩니다.</div>
        </div>
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose} disabled={saving}>취소</button><button type="submit" className="save-button" disabled={saving}>{saving ? <><LoaderCircle size={16} className="spin" /> 저장 중</> : <><Check size={16} /> {song ? "변경 저장" : "곡 추가"}</>}</button></div>
      </form>
    </div>
  );
}

export default function Home() {
  const songsQuery = trpc.songs.list.useQuery(undefined, { refetchInterval: 3000, refetchOnWindowFocus: true });
  const utils = trpc.useUtils();
  const createSong = trpc.songs.create.useMutation({ onSuccess: async () => { await utils.songs.list.invalidate(); toast.success("곡을 추가했어요."); setEditor(undefined); }, onError: (error) => toast.error(error.message || "곡을 추가하지 못했어요.") });
  const updateSong = trpc.songs.update.useMutation({ onSuccess: async () => { await utils.songs.list.invalidate(); toast.success("곡 정보를 업데이트했어요."); setEditor(undefined); }, onError: (error) => toast.error(error.message || "곡을 수정하지 못했어요.") });
  const removeSong = trpc.songs.remove.useMutation({ onSuccess: async () => { await utils.songs.list.invalidate(); toast.success("곡을 삭제했어요."); }, onError: (error) => toast.error(error.message || "곡을 삭제하지 못했어요.") });

  const songs = songsQuery.data ?? [];
  const [activeCategory, setActiveCategory] = useState<Category>("전체 악보");
  const [searchQuery, setSearchQuery] = useState("");
  const [editor, setEditor] = useState<Song | null | undefined>(undefined);
  const [playingSong, setPlayingSong] = useState<Song | null>(null);
  const [menuSongId, setMenuSongId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminGateOpen, setAdminGateOpen] = useState(false);

  const filteredSongs = useMemo(() => songs.filter((song) => {
    const categoryMatch = activeCategory === "전체 악보" || song.category === activeCategory;
    const searchMatch = `${song.title} ${song.category}`.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  }), [activeCategory, searchQuery, songs]);

  const categoryCount = (category: Category) => category === "전체 악보" ? songs.length : songs.filter((song) => song.category === category).length;

  const openAdminGate = () => setAdminGateOpen(true);
  const unlockAdmin = (password: string) => {
    setAdminPassword(password);
    setAdminGateOpen(false);
    toast.success("관리자 모드가 시작됐어요.");
  };
  const openEditor = (song: Song | null) => {
    if (!adminPassword) {
      openAdminGate();
      return;
    }
    setEditor(song);
  };

  const saveSong = async (form: FormState, file: File | null) => {
    if (!adminPassword) {
      openAdminGate();
      return;
    }
    let filePayload: FilePayload | undefined;
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("파일은 50MB 이하로 올려 주세요.");
        return;
      }
      filePayload = await encodeFile(file);
    }
    const base = { title: form.title.trim(), category: form.category, slideCount: Math.max(1, Number(form.slideCount) || 1) };
    if (editor) {
      updateSong.mutate({ id: editor.id, adminPassword, data: base, file: filePayload });
    } else {
      createSong.mutate({ ...base, adminPassword, color: colors[songs.length % colors.length], file: filePayload });
    }
  };

  const downloadSong = (song: Song) => {
    if (!song.fileUrl) {
      toast.info("이 곡은 아직 PPT 원본이 연결되지 않았어요. 곡 수정에서 파일을 올려 주세요.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = song.fileUrl;
    anchor.download = song.fileName ?? `${song.title}.pptx`;
    anchor.click();
  };

  const dropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.(ppt|pptx|pdf)$/i.test(file.name)) {
      toast.error("PPT, PPTX 또는 PDF 파일만 올릴 수 있어요.");
      return;
    }
    if (!adminPassword) {
      toast.info("PPT를 추가하려면 먼저 관리자 모드를 시작해 주세요.");
      openAdminGate();
      return;
    }
    setEditor(null);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(".editor-modal input[type=file]");
      const transfer = new DataTransfer();
      transfer.items.add(file);
      if (input) { input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true })); }
    }, 0);
  };

  return (
    <div className="archive-shell" onClick={() => setMenuSongId(null)}>
      <aside className="sidebar">
        <div className="sidebar-top"><AppLogo /><button className="mobile-menu" aria-label="메뉴"><Menu size={19} /></button></div>
        <div className="sidebar-section-label">LIBRARY</div>
        <nav className="category-nav" aria-label="악보 분류">
          {categories.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveCategory(label)} className={`category-link ${activeCategory === label ? "active" : ""}`}><span className="category-icon"><Icon size={17} /></span><span>{label}</span><span className="category-count">{categoryCount(label)}</span></button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note"><Music2 size={17} /><div><strong>실시간 찬양창고</strong><p>곡을 추가하거나 수정하면<br />모든 화면에 바로 반영돼요.</p></div></div>
        <div className="sidebar-footer"><button className="sidebar-footer-link"><CircleHelp size={16} /> 사용 방법</button><span className="version">v 0.2 · live</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span className="breadcrumb-muted">Library</span><ChevronRight size={14} /><span>{activeCategory}</span></div><div className="topbar-actions"><span className={`live-status ${songsQuery.isFetching ? "syncing" : ""}`}><span /> {songsQuery.isFetching ? "동기화 중" : "실시간 동기화"}</span><button className={`admin-mode-button ${adminPassword ? "active" : ""}`} onClick={() => adminPassword ? setAdminPassword("") : openAdminGate()}><span className="admin-mode-icon">{adminPassword ? <ShieldCheck size={14} /> : <LockKeyhole size={14} />}</span>{adminPassword ? "관리자 모드 ON" : "관리자 모드"}</button><button className="top-icon-button" aria-label="도움말"><CircleHelp size={18} /></button><div className="avatar">윤</div></div></header>
        <div className="page-wrap">
          <section className="hero-row compact-hero"><div><div className="eyebrow"><span className="eyebrow-dot" /> LIVE PRAISE LIBRARY</div><h1>필요한 곡을 꺼내<br /><em>바로 시작해요.</em></h1><p className="hero-copy">곡을 추가하고 수정하면 이곳에 바로 업데이트됩니다.<br />예배에 필요한 악보를 한 곳에서 관리해 보세요.</p></div><div className="hero-note-art" aria-hidden="true"><span className="floating-note note-one">♪</span><span className="floating-note note-two">♫</span><span className="floating-note note-three">♩</span><div className="hero-staff-lines">{[0, 1, 2, 3, 4].map((line) => <span key={line} />)}</div><div className="hero-staff-notes">♩　♪　♫</div></div></section>

          <section className={`upload-card ${isDragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={dropFile}><div className="upload-inner"><div className="upload-symbol"><UploadCloud size={25} strokeWidth={1.7} /></div><div className="upload-copy"><strong>PPT를 놓거나 새 곡을 추가하세요</strong><span>{adminPassword ? "관리자 모드에서 곡 이름·분류를 저장하고 원본 PPT를 올릴 수 있어요." : "곡을 추가하려면 관리자 모드를 먼저 시작해 주세요."}</span></div><button className="upload-button" onClick={(event) => { event.stopPropagation(); openEditor(null); }}><Plus size={17} /> 곡 추가</button></div></section>

          <section className="library-section"><div className="section-heading"><div><div className="section-kicker">YOUR SONGS</div><h2>{activeCategory}</h2><span className="result-count">{filteredSongs.length}곡</span></div><div className="view-tools"><div className="search-box"><Search size={17} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="곡 이름 검색" aria-label="곡 이름 검색" /></div><button className="refresh-chip" onClick={() => songsQuery.refetch()}><span className="refresh-dot" /> 새로고침</button></div></div>
            {songsQuery.isLoading ? <div className="loading-state"><LoaderCircle className="spin" size={25} /><span>찬양곡을 불러오는 중이에요...</span></div> : filteredSongs.length ? <div className="song-list">{filteredSongs.map((song) => <article className="song-card" key={song.id}><div className="song-preview"><MusicPaper song={song} compact /></div><div className="song-main"><div className="song-title-line"><div><h3>{song.title}</h3><div className="song-meta"><span className={`category-badge badge-${song.category === "찬송가" ? "hymn" : "ccm"}`}>{song.category}</span><span>{formatUpdated(song.updatedAt)}</span></div></div><div className="song-menu-wrap"><button className="more-button" onClick={(event) => { event.stopPropagation(); setMenuSongId(menuSongId === song.id ? null : song.id); }} aria-label={`${song.title} 메뉴`}><MoreHorizontal size={19} /></button>{menuSongId === song.id && <div className="song-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => { openEditor(song); setMenuSongId(null); }}><Pencil size={14} /> 곡 정보 수정</button><button className="danger" onClick={() => { if (!adminPassword) { setMenuSongId(null); openAdminGate(); return; } if (window.confirm(`'${song.title}' 곡을 삭제할까요?`)) removeSong.mutate({ id: song.id, adminPassword }); setMenuSongId(null); }}><Trash2 size={14} /> 곡 삭제</button></div>}</div></div><div className="song-bottom"><FileTypeBadge song={song} /><span className="slide-count"><FileMusic size={13} /> {song.slideCount} slides</span><div className="song-actions"><button className="slide-action" onClick={() => setPlayingSong(song)}><Play size={14} fill="currentColor" /> 슬라이드쇼</button><button className="download-action" onClick={() => downloadSong(song)} aria-label={`${song.title} 다운로드`}><ArrowDownToLine size={17} /></button></div></div></div></article>)}</div> : <div className="empty-state"><FolderOpen size={25} /><h3>{searchQuery ? "검색 결과가 없어요" : "아직 곡이 없어요"}</h3><p>관리자 모드에서 첫 곡을 등록해 보세요.</p><button onClick={() => openEditor(null)}><Plus size={15} /> 곡 추가</button></div>}
          </section>
          <footer className="page-footer"><span>찬양창고 · 함께 만드는 예배 자료실</span><span>{songsQuery.dataUpdatedAt ? `마지막 동기화 ${formatUpdated(new Date(songsQuery.dataUpdatedAt))}` : "실시간 연결 중"}</span></footer>
        </div>
      </main>
      {adminGateOpen && <AdminGate onClose={() => setAdminGateOpen(false)} onUnlock={unlockAdmin} />}
      {editor !== undefined && <SongEditor song={editor} onClose={() => setEditor(undefined)} onSubmit={saveSong} saving={createSong.isPending || updateSong.isPending} />}
      {playingSong && <PresentationMode song={playingSong} onClose={() => setPlayingSong(null)} />}
    </div>
  );
}
