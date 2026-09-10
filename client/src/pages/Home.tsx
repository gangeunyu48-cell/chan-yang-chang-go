import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FileArchive,
  FileMusic,
  FilePlus2,
  FolderOpen,
  Grid2X2,
  List,
  Menu,
  MoreHorizontal,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Hymn = {
  id: string;
  title: string;
  category: string;
  pages: number;
  updated: string;
  tone: string;
  color: string;
  fileName: string;
  uploaded?: boolean;
};

const starterHymns: Hymn[] = [
  {
    id: "grace",
    title: "은혜",
    category: "예배 찬양",
    pages: 4,
    updated: "오늘",
    tone: "G",
    color: "rose",
    fileName: "은혜_예배찬양.pptx",
  },
  {
    id: "blessing",
    title: "축복하노라",
    category: "축복송",
    pages: 3,
    updated: "어제",
    tone: "D",
    color: "sage",
    fileName: "축복하노라.pptx",
  },
  {
    id: "way",
    title: "주가 일하시네",
    category: "감사와 고백",
    pages: 5,
    updated: "3일 전",
    tone: "C",
    color: "amber",
    fileName: "주가_일하시네.pptx",
  },
  {
    id: "promise",
    title: "주의 약속하신 말씀 위에서",
    category: "찬송가",
    pages: 4,
    updated: "지난주",
    tone: "A",
    color: "blue",
    fileName: "주의_약속하신_말씀_위에서.pptx",
  },
  {
    id: "holy",
    title: "거룩하신 하나님",
    category: "경배",
    pages: 2,
    updated: "지난주",
    tone: "E",
    color: "violet",
    fileName: "거룩하신_하나님.pptx",
  },
  {
    id: "again",
    title: "다시 일어나",
    category: "소망",
    pages: 3,
    updated: "2주 전",
    tone: "F",
    color: "teal",
    fileName: "다시_일어나.pptx",
  },
];

const categories = ["전체 악보", "예배 찬양", "찬송가", "축복송", "감사와 고백", "경배", "소망"];

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="brand-note brand-note-one">♪</span>
      <span className="brand-note brand-note-two">♫</span>
      <span className="brand-stem" />
    </div>
  );
}

function MusicPaper({ hymn, compact = false }: { hymn: Hymn; compact?: boolean }) {
  return (
    <div className={`music-paper paper-${hymn.color} ${compact ? "music-paper-compact" : ""}`}>
      <div className="paper-topline">
        <span>{hymn.category}</span>
        <span className="paper-corner">찬양창고</span>
      </div>
      <div className="paper-title">{hymn.title}</div>
      <div className="paper-subtitle">Key of {hymn.tone} · Lead sheet</div>
      <div className="staff-area" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => (
          <span className="staff-line" key={line} style={{ top: `${22 + line * 8}px` }} />
        ))}
        <span className="paper-note note-a">♩</span>
        <span className="paper-note note-b">♪</span>
        <span className="paper-note note-c">♫</span>
        <span className="paper-note note-d">♩</span>
      </div>
      <div className="paper-footer">
        <span>01</span>
        <span>praise archive</span>
      </div>
    </div>
  );
}

function FileTypeBadge() {
  return (
    <span className="file-type-badge">
      <FileMusic size={14} strokeWidth={2.2} /> PPTX
    </span>
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

function SlideShow({ hymn, onClose }: { hymn: Hymn; onClose: () => void }) {
  const [slide, setSlide] = useState(1);
  const totalSlides = hymn.pages;
  const slideTitles = [hymn.title, "Verse 01", "Chorus", "Bridge", "Ending"];
  const slideTitle = slideTitles[slide - 1] ?? `${hymn.title} · ${slide}`;

  const next = () => setSlide((current) => Math.min(totalSlides, current + 1));
  const previous = () => setSlide((current) => Math.max(1, current - 1));

  return (
    <div className="slideshow-overlay" role="dialog" aria-modal="true" aria-label={`${hymn.title} 슬라이드쇼`}>
      <div className="slideshow-topbar">
        <div className="slideshow-brand">
          <BrandMark />
          <span>{hymn.title}</span>
          <span className="slideshow-divider">/</span>
          <span className="slideshow-muted">{slide} / {totalSlides}</span>
        </div>
        <button className="icon-button icon-button-dark" onClick={onClose} aria-label="슬라이드쇼 닫기">
          <X size={20} />
        </button>
      </div>
      <div className="slideshow-stage">
        <button className="slide-nav" onClick={previous} disabled={slide === 1} aria-label="이전 슬라이드">
          <ArrowLeft size={22} />
        </button>
        <div className="presentation-slide">
          <div className="presentation-kicker">찬양창고 · {hymn.category}</div>
          <h2>{slideTitle}</h2>
          <div className="presentation-line" />
          <div className="presentation-staff" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((line) => <span key={line} style={{ top: `${25 + line * 18}px` }} />)}
            <b>♩</b><i>♪</i><em>♫</em><strong>♩</strong>
          </div>
          <div className="presentation-lyrics">주님의 은혜 안에 오늘도 노래합니다</div>
          <div className="presentation-footer"><span>Key {hymn.tone}</span><span>{String(slide).padStart(2, "0")}</span></div>
        </div>
        <button className="slide-nav" onClick={next} disabled={slide === totalSlides} aria-label="다음 슬라이드">
          <ArrowRight size={22} />
        </button>
      </div>
      <div className="slideshow-controls">
        <div className="slide-dots">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button key={index} className={`slide-dot ${slide === index + 1 ? "active" : ""}`} onClick={() => setSlide(index + 1)} aria-label={`${index + 1}번 슬라이드`} />
          ))}
        </div>
        <button className="slideshow-download" onClick={() => toast.success("다운로드 준비가 되었어요.")}>
          <ArrowDownToLine size={16} /> 원본 다운로드
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [hymns, setHymns] = useState<Hymn[]>(starterHymns);
  const [activeCategory, setActiveCategory] = useState("전체 악보");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [playingHymn, setPlayingHymn] = useState<Hymn | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHymns = useMemo(() => {
    return hymns.filter((hymn) => {
      const matchesCategory = activeCategory === "전체 악보" || hymn.category === activeCategory;
      const matchesSearch = hymn.title.toLowerCase().includes(searchQuery.toLowerCase()) || hymn.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, hymns, searchQuery]);

  const handleFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => /\.(ppt|pptx|pdf)$/i.test(file.name));
    if (!validFiles.length) {
      toast.error("PPT, PPTX 또는 PDF 파일을 올려주세요.");
      return;
    }
    const newHymns = validFiles.map((file, index): Hymn => ({
      id: `${file.name}-${Date.now()}-${index}`,
      title: file.name.replace(/\.(pptx?|pdf)$/i, "").replace(/[_-]+/g, " "),
      category: "새로 올린 악보",
      pages: 4,
      updated: "방금 전",
      tone: "—",
      color: ["rose", "sage", "amber", "blue"][index % 4],
      fileName: file.name,
      uploaded: true,
    }));
    setHymns((current) => [...newHymns, ...current]);
    setIsUploadOpen(false);
    toast.success(`${validFiles.length}개의 악보를 찬양창고에 담았어요.`);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) handleFiles(event.target.files);
    event.target.value = "";
  };

  const downloadHymn = (hymn: Hymn) => {
    const blob = new Blob([`찬양창고\n${hymn.title}\n${hymn.fileName}`], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = hymn.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${hymn.title} 다운로드를 시작했어요.`);
  };

  return (
    <div className="archive-shell">
      <aside className="sidebar">
        <div className="sidebar-top"><AppLogo /><button className="mobile-menu" aria-label="메뉴"><Menu size={19} /></button></div>
        <div className="sidebar-section-label">LIBRARY</div>
        <nav className="category-nav" aria-label="악보 분류">
          {categories.map((category, index) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={`category-link ${activeCategory === category ? "active" : ""}`}>
              <span className={`category-icon ${index === 0 ? "all" : ""}`}><FileMusic size={16} /></span>
              <span>{category}</span>
              {index === 0 && <span className="category-count">{hymns.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <Sparkles size={17} />
          <div><strong>찬양을 모아두세요</strong><p>예배 전, 필요한 악보를<br />빠르게 찾아보세요.</p></div>
        </div>
        <div className="sidebar-footer"><button className="sidebar-footer-link"><CircleHelp size={16} /> 사용 방법</button><span className="version">v 0.1 · beta</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span className="breadcrumb-muted">Library</span><ChevronRight size={14} /><span>{activeCategory}</span></div>
          <div className="topbar-actions"><button className="top-icon-button" aria-label="도움말"><CircleHelp size={18} /></button><div className="avatar">윤</div></div>
        </header>

        <div className="page-wrap">
          <section className="hero-row">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> MY PRAISE LIBRARY</div><h1>악보를 꺼내<br /><em>찬양을 시작해요.</em></h1><p className="hero-copy">소중한 찬양 자료를 한 곳에 모아두고<br />예배의 순간마다 다시 꺼내보세요.</p></div>
            <div className="hero-note-art" aria-hidden="true"><span className="floating-note note-one">♪</span><span className="floating-note note-two">♫</span><span className="floating-note note-three">♩</span><div className="hero-staff-lines">{[0, 1, 2, 3, 4].map((line) => <span key={line} />)}</div><div className="hero-staff-notes">♩　♪　♫</div></div>
          </section>

          <section className="upload-card" onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}>
            <div className={`upload-inner ${isDragging ? "dragging" : ""}`}>
              <div className="upload-symbol"><UploadCloud size={25} strokeWidth={1.7} /></div>
              <div className="upload-copy"><strong>PPT 악보를 여기에 놓아주세요</strong><span>또는 내 컴퓨터에서 파일을 선택하세요 · PPT, PPTX, PDF</span></div>
              <button className="upload-button" onClick={() => setIsUploadOpen(true)}><FilePlus2 size={17} /> 악보 올리기</button>
            </div>
          </section>

          <section className="library-section">
            <div className="section-heading"><div><div className="section-kicker">YOUR COLLECTION</div><h2>{activeCategory}</h2><span className="result-count">{filteredHymns.length}개의 악보</span></div><div className="view-tools"><div className="search-box"><Search size={17} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="악보 이름 검색" aria-label="악보 이름 검색" /></div><button className="filter-button"><SlidersHorizontal size={16} /> 필터</button><div className="view-switcher"><button className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")} aria-label="카드 보기"><Grid2X2 size={17} /></button><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")} aria-label="목록 보기"><List size={18} /></button></div></div></div>
            {filteredHymns.length ? <div className={view === "grid" ? "hymn-grid" : "hymn-list"}>{filteredHymns.map((hymn, index) => view === "grid" ? <article className="hymn-card" key={hymn.id} style={{ animationDelay: `${index * 45}ms` }}><div className="card-preview"><MusicPaper hymn={hymn} /><button className="quick-play" onClick={() => setPlayingHymn(hymn)} aria-label={`${hymn.title} 슬라이드쇼`}><Play size={17} fill="currentColor" /></button><span className="page-pill">{hymn.pages} slides</span></div><div className="card-info"><div className="card-title-row"><div><h3>{hymn.title}</h3><span className="card-meta">{hymn.category} · {hymn.updated}</span></div><button className="more-button" aria-label="더 보기"><MoreHorizontal size={18} /></button></div><div className="card-bottom"><FileTypeBadge /><div className="card-actions"><button className="text-action" onClick={() => setPlayingHymn(hymn)}><Play size={14} /> 슬라이드쇼</button><button className="download-action" onClick={() => downloadHymn(hymn)} aria-label={`${hymn.title} 다운로드`}><ArrowDownToLine size={16} /></button></div></div></div></article> : <article className="hymn-row" key={hymn.id}><MusicPaper hymn={hymn} compact /><div className="row-title"><h3>{hymn.title}</h3><span>{hymn.category} · {hymn.updated}</span></div><span className="row-pages">{hymn.pages} slides</span><button className="text-action" onClick={() => setPlayingHymn(hymn)}><Play size={14} /> 보기</button><button className="download-action" onClick={() => downloadHymn(hymn)}><ArrowDownToLine size={16} /></button></article>)}</div> : <div className="empty-state"><FolderOpen size={25} /><h3>아직 찾는 악보가 없어요</h3><p>다른 검색어를 입력하거나 새 악보를 올려보세요.</p></div>}
          </section>
          <footer className="page-footer"><span>찬양창고 · 함께 만드는 예배 자료실</span><span>Updated just now</span></footer>
        </div>
      </main>

      {isUploadOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsUploadOpen(false); }}><div className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-header"><div><div className="section-kicker">ADD TO LIBRARY</div><h2 id="upload-title">새 악보 올리기</h2></div><button className="icon-button" onClick={() => setIsUploadOpen(false)} aria-label="닫기"><X size={19} /></button></div><div className="modal-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}><div className="modal-upload-icon"><FileArchive size={26} /></div><strong>PPT 파일을 선택하세요</strong><span>파일명에서 악보 이름을 자동으로 가져옵니다.</span><button className="modal-select-button" onClick={() => fileInputRef.current?.click()}>내 컴퓨터에서 선택</button><input ref={fileInputRef} type="file" accept=".ppt,.pptx,.pdf" multiple hidden onChange={onFileChange} /></div><div className="modal-tip"><Check size={15} /> 업로드한 파일은 이 브라우저에서 바로 목록에 표시됩니다.</div></div></div>}
      {playingHymn && <SlideShow hymn={playingHymn} onClose={() => setPlayingHymn(null)} />}
    </div>
  );
}

export { MusicPaper };

// Ensure the exported preview primitive remains tree-shakeable for future detail pages.
void MusicPaper;

