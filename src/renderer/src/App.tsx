import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Film, Search, Settings, RefreshCw, CheckCircle, AlertCircle, X, Globe, Image as ImageIcon, Monitor, ChevronRight, Database, Undo2, LayoutTemplate, FolderInput, ArrowRightLeft, Heart, Sparkles, Crown, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Assets
import bgImg from './assets/background.jpeg';
import logoImg from './assets/icon.png';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface FileItem { name: string; path: string; size: number; }
interface TPDBResult { id: string; title: string; site: string; date: string; performers: string[]; poster: string; tags?: string[]; description?: string; }
interface HistoryItem { oldPath: string; newPath: string; timestamp: number; }

const isElectron = 'electron' in window;
const ipc = isElectron ? (window as any).electron : {
  scanFiles: async () => [],
  renameFile: async () => true,
  selectDirectory: async () => [''],
  searchTPDB: async () => [],
  undoRename: async () => true,
  getAppInfo: async () => ({ name: 'Renamer', version: '1.0.0', author: 'Dev' }),
  openExternal: async () => {}
};

const dictionary = {
  en: { 
    source: "Source Folder", refresh: "Refresh", settings: "Config", analysis: "Analysis", filename: "Filename", size: "Size", 
    prefix: "Studio / Prefix", searchLabel: "Search Query", dbSearch: "DB Search", apply: "Apply", undo: "Undo", 
    renameMode: "Rename Action", mode1: "Move to Subfolder", mode2: "Move to Root", mode3: "Rename Only", 
    save: "Save", cancel: "Cancel", success: "Renamed!", tokenHelp: "Token stored locally. Required for metadata.",
    langLabel: "Language", tokenLabel: "ThePornDB API Token", placeholderToken: "Paste Bearer Token..."
  },
  de: { 
    source: "Quellordner", refresh: "Aktualisieren", settings: "Optionen", analysis: "Analyse", filename: "Dateiname", size: "Größe", 
    prefix: "Studio / Prefix", searchLabel: "Suchbegriff", dbSearch: "DB Suche", apply: "Übernehmen", undo: "Rückgängig", 
    renameMode: "Aktion nach Umbenennen", mode1: "In Unterordner", mode2: "In Zielordner", mode3: "Nur umbenennen", 
    save: "Speichern", cancel: "Abbrechen", success: "Umbenannt!", tokenHelp: "Token wird lokal gespeichert. Für Metadaten benötigt.",
    langLabel: "Sprache", tokenLabel: "ThePornDB API Token", placeholderToken: "Token einfügen..."
  },
  fr: { 
    source: "Source", refresh: "Actualiser", settings: "Config", analysis: "Analyse", filename: "Fichier", size: "Taille", 
    prefix: "Studio", searchLabel: "Recherche", dbSearch: "Chercher", apply: "Appliquer", undo: "Annuler", 
    renameMode: "Action", mode1: "Sous-dossier", mode2: "Racine", mode3: "Renommer seul", 
    save: "Sauver", cancel: "Annuler", success: "Renommé!", tokenHelp: "Jeton stocké localement.",
    langLabel: "Langue", tokenLabel: "Jeton API", placeholderToken: "Coller le jeton..."
  },
  es: { 
    source: "Fuente", refresh: "Refrescar", settings: "Ajustes", analysis: "Análisis", filename: "Archivo", size: "Tamaño", 
    prefix: "Estudio", searchLabel: "Búsqueda", dbSearch: "Buscar BD", apply: "Aplicar", undo: "Deshacer", 
    renameMode: "Acción", mode1: "Subcarpeta", mode2: "Raíz", mode3: "Renombrar", 
    save: "Guardar", cancel: "Cancelar", success: "¡Éxito!", tokenHelp: "Token guardado localmente.",
    langLabel: "Idioma", tokenLabel: "Token API", placeholderToken: "Pegar token..."
  },
  jp: { 
    source: "ソース", refresh: "更新", settings: "設定", analysis: "分析", filename: "ファイル名", size: "サイズ", 
    prefix: "スタジオ", searchLabel: "検索", dbSearch: "検索", apply: "適用", undo: "元に戻す", 
    renameMode: "アクション", mode1: "サブフォルダ", mode2: "ルート", mode3: "名前のみ変更", 
    save: "保存", cancel: "キャンセル", success: "完了！", tokenHelp: "トークンはローカルに保存されます。",
    langLabel: "言語", tokenLabel: "API トークン", placeholderToken: "トークンを入力..."
  }
};

export default function App() {
  const [currentDir, setCurrentDir] = useState<string>(localStorage.getItem('last_dir') || 'C:\\Downloads');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [prefix, setPrefix] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TPDBResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiToken, setApiToken] = useState(localStorage.getItem('tpdb_token') || '');
  const [renameMode, setRenameMode] = useState(localStorage.getItem('rename_mode') || 'move_sub');
  
  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error' | 'idle'}>({ msg: '', type: 'idle' });
  const [generatedThumb, setGeneratedThumb] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<TPDBResult | null>(null);
  const [appInfo, setAppInfo] = useState({ name: '', version: '', author: '' });
  const [licenses, setLicenses] = useState<any>(null);
  
  // CRASH FIX: Safe initialization of language state
  const getInitialLang = () => {
    const saved = localStorage.getItem('app_lang');
    // Ensure saved lang actually exists in dictionary, else default to 'en'
    return (saved && dictionary[saved as keyof typeof dictionary]) ? saved : 'en';
  };
  const [lang, setLang] = useState<string>(getInitialLang());

  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  
  // Safe Access to translations
  const t = dictionary[lang as keyof typeof dictionary];

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Fredoka:wght@400;500;600&family=Dancing+Script:wght@700&family=Noto+Sans+JP:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    if (currentDir) loadFiles();
    ipc.getAppInfo().then(setAppInfo);
  }, [currentDir]);

  useEffect(() => {
    if (showAbout && !licenses) {
      fetch('./licenses.json').then(res => res.json()).then(setLicenses).catch(() => setLicenses({}));
    }
  }, [showAbout]);

  const loadFiles = async () => {
    try {
      const fileList = await ipc.scanFiles(currentDir);
      setFiles(fileList);
    } catch (e) { setStatus({ msg: 'Scan Error', type: 'error' }); }
  };

  const handleSelectDir = async () => {
    const dirs = await ipc.selectDirectory();
    if (dirs && dirs.length > 0) {
      setCurrentDir(dirs[0]);
      localStorage.setItem('last_dir', dirs[0]);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    setSelectedResult(null);
    setResults([]);
    setStatus({ msg: '', type: 'idle' });
    setGeneratedThumb(null);
    let clean = file.name.replace(/\.[^/.]+$/, "").replace(/[._-]/g, ' ').replace(/\b\d{3,4}p\b/gi, '').trim();
    setQuery(clean);
    generateThumbnail(file.path);
  };

  const generateThumbnail = (filePath: string) => {
    if (!hiddenVideoRef.current) return;
    const video = hiddenVideoRef.current;
    video.src = `file://${filePath}`;
    video.currentTime = 30;
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setGeneratedThumb(canvas.toDataURL('image/jpeg'));
      video.src = "";
    };
  };

  const searchTPDB = async () => {
    if (!apiToken) { setShowSettings(true); return; }
    setIsSearching(true);
    const fullQuery = prefix ? `${prefix} ${query}` : query;
    try {
      const data = await ipc.searchTPDB(apiToken, fullQuery);
      const mapped = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        site: item.site?.name || 'Unknown',
        date: item.date,
        performers: item.performers ? item.performers.map((p: any) => p.name) : [],
        poster: item.posters?.large || item.poster || '',
        tags: item.tags ? item.tags.map((t: any) => t.name) : [],
        description: item.description
      }));
      setResults(mapped);
      if (mapped.length === 0) setStatus({ msg: 'No Results', type: 'error' });
    } catch (err) { setStatus({ msg: 'API Error', type: 'error' }); } 
    finally { setIsSearching(false); }
  };

  const executeRename = async (result: TPDBResult) => {
    if (!selectedFile) return;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ""; }
    
    const ext = selectedFile.name.split('.').pop();
    const performersStr = result.performers.length > 0 ? ` (${result.performers.join(', ')})` : '';
    let newBase = `${result.site} - ${result.title}${performersStr}`.replace(/[<>:"/\\|?*]/g, '').trim();
    
    try {
      const res = await ipc.renameFile(selectedFile.path, { 
        targetDir: currentDir, 
        newName: `${newBase}.${ext}`, 
        subFolder: newBase,
        mode: renameMode 
      });
      
      setStatus({ msg: t.success, type: 'success' });
      setHistory(prev => [{ oldPath: res.oldPath, newPath: res.newPath, timestamp: Date.now() }, ...prev]);
      setFiles(files.filter(f => f.path !== selectedFile.path));
      setSelectedFile(null); setSelectedResult(null); setResults([]); setGeneratedThumb(null); setQuery('');
    } catch (err) {
      setStatus({ msg: 'Error: File Locked', type: 'error' });
      if (videoRef.current) videoRef.current.src = `file://${selectedFile.path}`;
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastAction = history[0];
    const success = await ipc.undoRename(lastAction.newPath, lastAction.oldPath);
    if (success) {
      setHistory(prev => prev.slice(1));
      setStatus({ msg: 'Undo Successful', type: 'success' });
      loadFiles();
    } else {
      setStatus({ msg: 'Undo Failed', type: 'error' });
    }
  };

  const saveConfig = () => {
    localStorage.setItem('tpdb_token', apiToken);
    localStorage.setItem('rename_mode', renameMode);
    localStorage.setItem('app_lang', lang);
    setShowSettings(false);
  };

  const openLink = (url: string) => ipc.openExternal(url);

  return (
    <div className="flex h-screen w-full font-sans text-sm overflow-hidden relative text-white">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-black">
        <img src={bgImg} className="w-full h-full object-cover opacity-60" alt="bg" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>
      <video ref={hiddenVideoRef} className="hidden" muted />

      {/* --- SIDEBAR --- */}
      <div className="w-64 glass-panel m-3 mr-0 flex flex-col z-20 border-white/10 relative overflow-hidden bg-black/50">
        <div className="p-6 flex flex-col items-center gap-1 border-b border-white/10 bg-white/5">
          <div className="relative group mb-2 cursor-pointer" onClick={() => setShowAbout(true)}>
            <div className="absolute inset-0 bg-pop-pink blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <img 
              src={logoImg} 
              className="w-auto h-24 drop-shadow-xl relative z-10 transition-transform hover:scale-105 object-contain p-2" 
            />
          </div>
          <div className="text-center">
            <h1 className="font-display font-black text-2xl tracking-tighter leading-none text-white drop-shadow-md">
              KINGDOM <span className="text-pop-pink">CUM</span>
            </h1>
            <span className="font-sans font-bold text-xs tracking-widest text-pop-cyan uppercase block mt-1">Renamer</span>
            <p className="font-script text-xl text-pop-pink -rotate-3 mt-1 drop-shadow-md cursor-pointer hover:text-white transition-colors" onClick={() => openLink('https://peppermintdrop.gumroad.com')}>by PeppermintDrop</p>
          </div>
        </div>

        <div className="p-3 pb-2 space-y-2">
          <button onClick={handleSelectDir} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-all shadow-sm group">
            <div className="bg-pop-cyan/20 p-1.5 rounded-lg text-pop-cyan group-hover:scale-110 transition-transform"><FolderOpen size={16} /></div>
            <div className="text-left overflow-hidden">
              <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{t.source}</div>
              <div className="text-xs font-bold truncate max-w-[140px] text-gray-200" title={currentDir}>{currentDir.split('\\').pop()}</div>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-4 scrollbar-thin">
          {files.map((file, idx) => (
            <div 
              key={idx} 
              onClick={() => handleFileSelect(file)} 
              className={cn(
                "p-2.5 rounded-xl cursor-pointer transition-all border flex items-center gap-3 backdrop-blur-sm",
                selectedFile?.path === file.path 
                  ? "bg-gradient-to-r from-pop-pink/80 to-purple-600/80 text-white shadow-neon-pink border-pop-pink scale-[1.02]" 
                  : "bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20 text-gray-300 hover:text-white"
              )}
            >
              <Film size={14} className={selectedFile?.path === file.path ? "text-white" : "text-gray-500"} />
              <div className="truncate text-xs font-bold">{file.name}</div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 flex justify-between bg-black/40">
          <button onClick={loadFiles} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Reload Files"><RefreshCw size={16} /></button>
          <button onClick={() => setShowAbout(true)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-pop-cyan transition-colors" title="About"><Info size={16} /></button>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-pop-pink transition-colors" title="Settings"><Settings size={16} /></button>
        </div>
      </div>

      {/* --- MAIN STAGE --- */}
      <div className="flex-1 flex flex-col relative z-10 p-3 gap-3">
        
        {/* Top: Split View */}
        <div className="h-[55%] flex gap-3 min-h-0">
          <div className="flex-1 glass-panel bg-black/80 flex flex-col overflow-hidden relative group border-white/20">
            <div className="flex-1 relative flex items-center justify-center">
              {selectedFile ? (
                <video key={selectedFile.path} src={`file://${selectedFile.path}`} ref={videoRef} controls autoPlay className="w-full h-full object-contain max-h-full drop-shadow-2xl" />
              ) : (
                <div className="flex flex-col items-center justify-center text-white/30 gap-2">
                  <div className="bg-white/10 p-4 rounded-full"><Sparkles size={32} className="animate-pulse" /></div>
                  <span className="font-display font-bold tracking-widest text-lg opacity-50">SELECT A VIDEO</span>
                </div>
              )}
            </div>
            {generatedThumb && (
              <div className="absolute top-4 left-4 w-32 aspect-video rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl opacity-80 hover:opacity-100 transition-opacity bg-black z-20">
                <img src={generatedThumb} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="w-[420px] glass-panel flex flex-col overflow-hidden bg-black/60 border-white/20 relative">
            {selectedResult ? (
              <>
                <div className="h-56 relative shrink-0">
                  <img src={selectedResult.poster} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-4 right-4">
                    <div className="bg-pop-pink text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 shadow-neon-pink">{selectedResult.site}</div>
                    <h2 className="font-display font-bold text-xl leading-tight text-white drop-shadow-md line-clamp-2">{selectedResult.title}</h2>
                  </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResult.performers.map(p => (
                      <span key={p} className="text-[10px] font-bold bg-pop-purple/20 text-pop-cyan px-2 py-1 rounded-lg border border-pop-purple/30">{p}</span>
                    ))}
                  </div>
                  <div className="space-y-2 text-xs text-gray-300 font-medium bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="flex justify-between border-b border-white/10 pb-2"><span>Release:</span> <span className="font-mono text-white">{selectedResult.date}</span></p>
                    <p className="leading-relaxed pt-1 opacity-80 line-clamp-6">{selectedResult.description || 'No description available.'}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm">
                  <button onClick={() => executeRename(selectedResult)} className="btn-pop w-full bg-pop-cyan text-black py-3 flex items-center justify-center gap-2 shadow-neon-cyan">
                    <CheckCircle size={18} /> {t.apply}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-8 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5"><Database size={32} /></div>
                <h3 className="font-display font-bold text-lg text-white/60">Match Details</h3>
                <p className="text-xs max-w-[200px] leading-relaxed mt-2 text-white/40">Select a search result below to view details here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-[40%] glass-panel flex flex-col overflow-hidden bg-black/60 border-white/20">
          <div className="p-3 flex gap-3 items-center border-b border-white/10 bg-white/5">
            <div className="w-48">
              <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full glass-input px-4 py-2.5 text-sm font-bold shadow-sm placeholder-gray-500" placeholder={t.prefix} />
            </div>
            <div className="flex-1 relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchTPDB()} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm font-bold shadow-sm placeholder-gray-500" placeholder={t.searchLabel} />
              <Search size={16} className="absolute left-3 top-3 text-white/50" />
            </div>
            <button onClick={searchTPDB} disabled={isSearching} className="btn-pop bg-pop-pink text-white px-6 py-2.5 flex items-center gap-2 shadow-neon-pink">
              {isSearching ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />} Search
            </button>
            <button onClick={handleUndo} disabled={history.length === 0} className="btn-pop bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 disabled:opacity-30 border-white/20 shadow-none">
              <Undo2 size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-black/20">
            <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((res) => (
                <div 
                  key={res.id} 
                  onClick={() => setSelectedResult(res)}
                  className={cn(
                    "bg-black/60 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border group",
                    selectedResult?.id === res.id ? "border-pop-pink ring-2 ring-pop-pink/50" : "border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="aspect-[16/9] bg-gray-900 relative">
                    {res.poster ? <img src={res.poster} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="text-gray-700" /></div>}
                    <div className="absolute bottom-2 left-2 bg-pop-pink text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">{res.site}</div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-xs text-gray-200 line-clamp-1 mb-1 group-hover:text-pop-pink transition-colors">{res.title}</h4>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>{res.date}</span>
                      <span className="truncate max-w-[80px] text-right">{res.performers[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {status.msg && <div className="absolute bottom-6 right-6 bg-white border border-pop-pink text-pop-pink px-4 py-2 rounded-full shadow-neon-pink flex items-center gap-2 font-bold text-xs animate-bounce"><CheckCircle size={14} /> {status.msg}</div>}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg glass-panel bg-[#121212] border-white/20 shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><Settings className="text-pop-pink" /> {t.settings}</h2>
                <button onClick={() => setShowSettings(false)}><X className="text-white/50 hover:text-red-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.tokenLabel}</label>
                  <input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} className="w-full glass-input p-3 font-mono text-sm" placeholder={t.placeholderToken} />
                  <p className="text-[10px] text-gray-400 mt-2">{t.tokenHelp}</p>
                </div>
                
                {/* Rename Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.renameMode}</label>
                  <div className="space-y-2">
                    {[
                      { id: 'move_sub', icon: FolderInput, label: t.mode1 },
                      { id: 'move_flat', icon: ArrowRightLeft, label: t.mode2 },
                      { id: 'rename_only', icon: LayoutTemplate, label: t.mode3 }
                    ].map((m) => (
                      <button 
                        key={m.id}
                        onClick={() => setRenameMode(m.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                          renameMode === m.id ? "border-pop-pink bg-pop-pink/10 text-white" : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-400"
                        )}
                      >
                        <m.icon size={18} className={renameMode === m.id ? "text-pop-pink" : "text-gray-500"} />
                        <span className="text-xs font-bold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.langLabel}</label>
                  <div className="flex gap-2">
                    {['en', 'de', 'fr', 'es', 'jp'].map((l) => (
                      <button 
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn(
                          "flex-1 py-2 rounded-lg font-bold uppercase text-xs border transition-all",
                          lang === l ? "border-pop-pink bg-pop-pink/10 text-pop-pink" : "border-white/10 text-gray-500 hover:border-white/20"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white/5 flex justify-end gap-3 border-t border-white/10">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-white transition-colors">{t.cancel}</button>
                <button onClick={saveConfig} className="btn-pop bg-pop-pink text-white px-6 py-2 shadow-neon">{t.save}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ABOUT MODAL - FIX: Better Layout & Padding */}
      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl glass-panel bg-[#0a0a0a] border-white/20 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-10 py-12 border-b border-white/10 flex justify-between items-center relative overflow-hidden bg-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-10 bg-pop-pink blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="flex items-center gap-6 relative z-10 w-full">
                  <div className="w-24 h-24 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/10 shadow-neon-pink p-2">
                    <img src={logoImg} className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-display font-black text-white tracking-tight mb-1">{appInfo.name || 'KINGDOM.CUM'}</h2>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-0.5 bg-pop-pink/20 text-pop-pink border border-pop-pink/30 rounded text-[10px] font-bold uppercase tracking-widest">v{appInfo.version}</span>
                      <span className="text-gray-500 text-xs">© {new Date().getFullYear()} {appInfo.author}</span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => openLink('https://peppermintdrop.gumroad.com')} className="flex items-center gap-2 text-xs font-bold bg-pop-cyan text-black px-4 py-2 rounded-lg hover:bg-white transition-colors shadow-neon-cyan">
                        <ExternalLink size={14} /> Check Updates
                      </button>
                      <button onClick={() => openLink('https://peppermintdrop.gumroad.com')} className="flex items-center gap-2 text-xs font-bold bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors border border-white/10">
                        <ShieldCheck size={14} /> Legal
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setShowAbout(false)} className="text-white/30 hover:text-white transition-colors p-2"><X size={24} /></button>
                </div>
              </div>

              {/* Licenses Content */}
              <div className="flex-1 overflow-y-auto px-16 py-6 bg-black/20">
                <div className="mb-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-pop-pink/10 inline-block px-2 py-1 rounded text-pop-pink">Third Party Licenses</h3>
                </div>
                <div className="space-y-2">
                  {licenses ? Object.entries(licenses).map(([pkgName, details]: any) => (
                    <div key={pkgName} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex justify-between items-center group">
                      <div>
                        <div className="text-sm font-bold text-gray-300 group-hover:text-white">{pkgName}</div>
                        <div className="text-[10px] text-gray-600 flex gap-2 mt-0.5">
                          <span>{details.licenses}</span>
                          {details.publisher && <span>• {details.publisher}</span>}
                        </div>
                      </div>
                      {details.repository && (
                        <button onClick={() => openLink(details.repository)} className="text-gray-600 hover:text-pop-cyan p-2"><Globe size={14} /></button>
                      )}
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 py-10">Loading licenses... (Run npm run gen:licenses)</div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/40 text-center text-[10px] text-gray-600">
                Made with <Heart size={10} className="inline text-pop-pink mx-1" /> for the community.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}