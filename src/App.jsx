import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Volume2,
  Save,
  Upload,
  Download,
  MoreHorizontal,
  X,
  Image as ImageIcon,
  MessageSquare,
  LayoutGrid,
  Zap,
  Search,
  Loader2,
  Key,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  WifiOff,
  Check,
  AlertCircle,
  Play,
  Delete,
  ArrowRightCircle,
  Type,
  FilePlus,
  Share
} from 'lucide-react';

/**
 * Zip EasySpeak AAC
 * Developed by Zip Solutions
 */

// --- Default Configuration Data ---
const DEFAULT_CONFIG = {
  version: 1,
  settings: {
    voiceURI: null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    adminPin: "",
    openSymbolsSecret: "", // Shared Secret (NOT the token)
    gridSize: "auto",
    offlineOnly: false,
    enableSentenceBuilder: false,
    speakOnSelect: false,
    showLabels: true, // Default to showing labels
  },
  pages: [
    {
      id: "p_core",
      label: "Core",
      icon: "🏠",
      color: "bg-blue-100",
      tiles: [
        { id: "t1", label: "I", phrase: "I", image: "🧍", type: "emoji", color: "bg-yellow-200", linkToPage: "" },
        { id: "t2", label: "Want", phrase: "want", image: "🤲", type: "emoji", color: "bg-green-200", linkToPage: "" },
        { id: "t3", label: "Stop", phrase: "Stop it", image: "🛑", type: "emoji", color: "bg-red-300", linkToPage: "" },
        { id: "t4", label: "More", phrase: "more", image: "➕", type: "emoji", color: "bg-blue-200", linkToPage: "" },
        { id: "t5", label: "Yes", phrase: "Yes", image: "👍", type: "emoji", color: "bg-white", linkToPage: "" },
        { id: "t6", label: "No", phrase: "No", image: "👎", type: "emoji", color: "bg-white", linkToPage: "" },
      ]
    },
    {
      id: "p_food",
      label: "Food",
      icon: "🍔",
      color: "bg-orange-50",
      tiles: [
        { id: "f1", label: "Apple", phrase: "apple", image: "🍎", type: "emoji", color: "bg-red-100", linkToPage: "" },
        { id: "f2", label: "Banana", phrase: "banana", image: "🍌", type: "emoji", color: "bg-yellow-100", linkToPage: "" },
        { id: "f3", label: "Water", phrase: "water", image: "💧", type: "emoji", color: "bg-blue-100", linkToPage: "" },
        { id: "f4", label: "Cookie", phrase: "cookie", image: "🍪", type: "emoji", color: "bg-amber-200", linkToPage: "" },
      ]
    }
  ]
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  // --- Main State ---
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activePageId, setActivePageId] = useState(DEFAULT_CONFIG.pages[0].id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  // --- Sentence Builder State ---
  const [sentence, setSentence] = useState([]); // Array of tile objects

  // --- Auth State ---
  const [accessToken, setAccessToken] = useState(null); // The actual Access Token (not secret)

  // --- UI State ---
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [editingTile, setEditingTile] = useState(null);
  const [editingPage, setEditingPage] = useState(null);

  // Security State
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinContext, setPinContext] = useState(null);

  // Search State
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // New state for visual feedback during download
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);
  const mergeInputRef = useRef(null); // Ref for merge import

  // --- Effects ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // --- Actions ---

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.settings.rate;
    utterance.pitch = config.settings.pitch;
    utterance.volume = config.settings.volume;

    if (config.settings.voiceURI) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === config.settings.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleTileClick = (tile) => {
    if (config.settings.enableSentenceBuilder) {
      setSentence(prev => [...prev, tile]);
      if (config.settings.speakOnSelect) {
        speak(tile.phrase);
      }
    } else {
      speak(tile.phrase);
    }

    if (tile.linkToPage && tile.linkToPage !== "") {
      const targetPage = config.pages.find(p => p.id === tile.linkToPage);
      if (targetPage) {
        setActivePageId(targetPage.id);
      }
    }
  };

  const playSentence = () => {
    if (sentence.length === 0) return;
    const fullText = sentence.map(t => t.phrase).join(" ");
    speak(fullText);
  };

  const clearSentence = () => setSentence([]);
  const removeLastWord = () => setSentence(prev => prev.slice(0, -1));

  // --- Import/Export ---
  const downloadJSON = (data, filename) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleExport = () => {
    downloadJSON(config, "zip_easyspeak_backup.json");
  };

  const handleExportPage = (page) => {
    // Wrap page in a compatible config structure so it can be re-imported
    const singlePageConfig = {
      version: 1,
      settings: config.settings, // Include current settings preference
      pages: [page]
    };
    downloadJSON(singlePageConfig, `page_${page.label.replace(/\s+/g, '_').toLowerCase()}.json`);
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.pages && Array.isArray(imported.pages)) {
          setConfig(imported);
          setActivePageId(imported.pages[0].id);
          alert("Full backup restored!");
        } else {
          alert("Invalid config file structure.");
        }
      } catch (err) { alert("Error parsing file."); }
    };
  };

  const handleMergeImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.pages && Array.isArray(imported.pages)) {
          // Check for duplicate IDs and regenerate if necessary (basic collision avoidance)
          const newPages = imported.pages.map(p => {
            // Simple check if ID exists, if so, new ID
            if (config.pages.some(existing => existing.id === p.id)) {
              return { ...p, id: generateId(), label: `${p.label} (Imported)` };
            }
            return p;
          });

          setConfig(prev => ({
            ...prev,
            pages: [...prev.pages, ...newPages]
          }));
          alert(`Success! Added ${newPages.length} page(s) to your board.`);
        } else {
          alert("Invalid file. No pages found.");
        }
      } catch (err) { alert("Error parsing file."); }
    };
  };

  const handleFactoryReset = () => {
    if (window.confirm("WARNING: Reset everything?")) {
      setConfig(DEFAULT_CONFIG);
      setPinPrompt(false);
      setPinInput("");
      setPinContext(null);
    }
  };

  // --- Security ---
  const requestAccess = (context) => {
    if (config.settings.adminPin) {
      setPinContext(context);
      setPinPrompt(true);
    } else {
      if (context === 'edit') setIsEditMode(true);
      if (context === 'settings') setShowSettings(true);
    }
  };

  const verifyPin = () => {
    if (pinInput === config.settings.adminPin) {
      setPinPrompt(false);
      setPinInput("");
      if (pinContext === 'edit') setIsEditMode(true);
      if (pinContext === 'settings') setShowSettings(true);
      setPinContext(null);
    } else {
      alert("Incorrect PIN");
      setPinInput("");
    }
  };

  // --- Proxy & Search ---
  const getProxyUrl = (url) => {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  };

  // High-performance image proxy (resizes and handles CORS)
  const getImageProxyUrl = (url) => {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp`;
  };

  // Use corsproxy.io for POST requests (Auth)
  const getPostProxyUrl = (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

  // Function: Exchange Shared Secret for Access Token
  const fetchAuthToken = async () => {
    let secret = config.settings.openSymbolsSecret;
    try {
      if (import.meta && import.meta.env) {
        if (!secret) secret = import.meta.env.VITE_OPENSYMBOLS_SECRET || "";
      }
    } catch (e) { }

    if (!secret) {
      throw new Error("Missing Shared Secret. Please add it in Settings.");
    }

    try {
      const tokenUrl = "https://www.opensymbols.org/api/v2/token";
      const formData = new URLSearchParams();
      formData.append('secret', secret.trim());

      const proxyRes = await fetch(getPostProxyUrl(tokenUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!proxyRes.ok) throw new Error(`Auth Failed: ${proxyRes.status}`);

      const data = await proxyRes.json();

      if (data.access_token) {
        console.log("Access Token received successfully.");
        return data.access_token;
      }

      throw new Error("No 'access_token' in response. Check Secret.");

    } catch (e) {
      console.error("Token exchange failed", e);
      throw e;
    }
  };

  const searchSymbols = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    try {
      let token = accessToken;

      if (!token) {
        try {
          token = await fetchAuthToken();
          setAccessToken(token);
        } catch (e) {
          console.log("Token fetch failed, trying without...", e);
        }
      }

      let target = `https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(searchQuery)}`;
      if (token) target += `&access_token=${token}`;

      const res = await fetch(getProxyUrl(target));

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Error: ${res.status} ${txt}`);
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("Invalid JSON response");
      }

      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
        if (data && (data.error || data.detail)) {
          if (data.error === "invalid access token") setAccessToken(null);
          throw new Error(data.error || data.detail);
        }
      }
    } catch (error) {
      console.error(error);
      alert(`Search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSymbol = async (url) => {
    setIsDownloading(true);
    try {
      const res = await fetch(getImageProxyUrl(url));
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingTile(prev => ({
          ...prev,
          type: 'image',
          image: reader.result
        }));
        setShowImageSearch(false);
        setIsDownloading(false);
        setIsSearching(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      setEditingTile(prev => ({
        ...prev,
        type: 'image',
        image: url
      }));
      setShowImageSearch(false);
      setIsDownloading(false);
      setIsSearching(false);
    }
  };

  // --- CRUD State Updates ---
  const updateSetting = (key, val) => setConfig(prev => ({ ...prev, settings: { ...prev.settings, [key]: val } }));

  // CRUD Helpers
  const addTile = () => {
    const newTile = { id: generateId(), label: "New", phrase: "New", image: "⬜", type: "emoji", color: "bg-white", linkToPage: "" };
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, tiles: [...pg.tiles, newTile] } : pg) }));
  };
  const updateTile = (t) => {
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, tiles: pg.tiles.map(ti => ti.id === t.id ? t : ti) } : pg) }));
    setEditingTile(null);
  };
  const deleteTile = (tid) => {
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, tiles: pg.tiles.filter(ti => ti.id !== tid) } : pg) }));
    setEditingTile(null);
  };
  const addPage = () => {
    const newPage = { id: generateId(), label: "New Page", icon: "📄", color: "bg-gray-100", tiles: [] };
    setConfig(p => ({ ...p, pages: [...p.pages, newPage] }));
    setActivePageId(newPage.id);
  };
  const updatePage = (up) => {
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === up.id ? up : pg) }));
    setEditingPage(null);
    setDeleteConfirm(false);
  };
  const deletePage = (pid) => {
    if (config.pages.length <= 1) return;
    const newPages = config.pages.filter(p => p.id !== pid);
    let nextId = activePageId;
    if (activePageId === pid) nextId = newPages[0].id;
    setActivePageId(nextId);
    setConfig(p => ({ ...p, pages: newPages }));
    setEditingPage(null);
    setDeleteConfirm(false);
  };

  // --- Render Helpers ---
  const activePage = config.pages.find(p => p.id === activePageId) || config.pages[0];
  const displayedVoices = config.settings.offlineOnly ? availableVoices.filter(v => v.localService) : availableVoices;
  const showLabels = config.settings.showLabels !== false; // Default true

  const getGridClass = () => {
    const s = config.settings.gridSize;
    if (s === 2) return "grid-cols-2";
    if (s === 3) return "grid-cols-3";
    if (s === 4) return "grid-cols-4";
    if (s === 6) return "grid-cols-6";
    if (s === 8) return "grid-cols-8";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
  };

  // --- Components ---

  const Tile = ({ tile, onClick, editMode }) => (
    <div
      onClick={() => !editMode && onClick(tile)}
      className={`relative group flex flex-col items-center justify-center aspect-square rounded-2xl shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer select-none overflow-hidden ${tile.color} border-black/10 hover:brightness-95`}
    >
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-1">
        {tile.type === 'image' ? (
          <img src={tile.image} alt={tile.label} className="max-w-full max-h-full object-contain pointer-events-none" />
        ) : (
          <span className="text-5xl md:text-6xl select-none">{tile.image}</span>
        )}
      </div>

      {showLabels && (
        <div className="w-full shrink-0 text-center py-1 px-1 bg-white/30 backdrop-blur-sm font-bold text-gray-800 text-sm md:text-base truncate flex items-center justify-center gap-1">
          {tile.label}
          {tile.linkToPage && <ArrowRightCircle size={12} className="text-blue-600 opacity-70" />}
        </div>
      )}

      {editMode && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={(e) => { e.stopPropagation(); setEditingTile(tile); }} className="p-3 bg-white rounded-full shadow-lg hover:bg-blue-50 text-blue-600 mr-2"><Edit2 size={20} /></button>
          <button onClick={(e) => { e.stopPropagation(); deleteTile(tile.id); }} className="p-3 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600"><Trash2 size={20} /></button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col md:flex-row overflow-hidden">

      {/* Sidebar */}
      <nav className="w-full md:w-24 md:h-screen bg-white shadow-xl flex md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 z-20">
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-slate-100 mb-2">
          <img src="/pwa-192x192.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm mb-1 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Zip</span>
        </div>
        <div className="p-2 md:p-4 flex md:flex-col items-center gap-2">
          {config.pages.map(page => (
            <button key={page.id} onClick={() => setActivePageId(page.id)} className={`flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 transition-all ${activePageId === page.id ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
              <span className="text-2xl mb-1">{page.icon}</span>
              <span className="text-[10px] font-bold truncate max-w-full leading-tight">{page.label}</span>
            </button>
          ))}
          {isEditMode && (
            <button onClick={addPage} className="flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-dashed border-green-300">
              <Plus size={24} /> <span className="text-[10px] font-bold mt-1">Add</span>
            </button>
          )}
        </div>
        <div className="md:mt-auto p-2 md:p-4 border-t border-slate-100 flex md:flex-col items-center justify-center gap-3">
          <button onClick={() => isEditMode ? setIsEditMode(false) : requestAccess('edit')} className={`p-3 rounded-full ${isEditMode ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}>
            {isEditMode ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
          <button onClick={() => requestAccess('settings')} className="p-3 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Settings size={20} /></button>
        </div>
      </nav>

      <main className={`flex-1 h-[calc(100vh-80px)] md:h-screen overflow-y-auto p-4 md:p-8 transition-colors ${activePage.color}`}>

        {/* --- Top Bar: Header or Sentence Strip --- */}
        <div className="mb-6 space-y-4">

          {/* Sentence Strip (Visible if Enabled) */}
          {config.settings.enableSentenceBuilder && (
            <div className="bg-white rounded-2xl shadow-lg p-2 min-h-[80px] flex items-center gap-2 border-2 border-blue-100">
              <div className="flex-1 flex gap-2 overflow-x-auto p-2">
                {sentence.length === 0 ? (
                  <span className="text-slate-300 italic pl-2 self-center">Build a sentence...</span>
                ) : (
                  sentence.map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center bg-slate-100 border border-slate-200 rounded-lg p-2 min-w-[60px] h-[60px]">
                      <span className="text-xl leading-none mb-1">{t.type === 'emoji' ? t.image : '🖼️'}</span>
                      <span className="text-[10px] font-bold truncate max-w-[60px]">{t.label}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-1 border-l pl-2 border-slate-100">
                <button onClick={removeLastWord} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl" title="Backspace"><Delete size={24} /></button>
                <button onClick={playSentence} className="p-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:scale-105 transition-all" title="Play"><Play size={24} fill="currentColor" /></button>
              </div>
            </div>
          )}

          {/* Page Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/pwa-192x192.png" alt="Logo" className="md:hidden w-8 h-8 rounded-lg shadow-sm object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              <h1 className="text-3xl font-bold flex items-center gap-2">{activePage.icon} {activePage.label}</h1>
              {isEditMode && <button onClick={() => setEditingPage(activePage)} className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-500"><Edit2 size={16} /></button>}
            </div>
            {/* Quick Voice Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full text-xs text-slate-500 font-bold">
              {config.settings.enableSentenceBuilder ? 'MODE: SENTENCE' : 'MODE: DIRECT'}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className={`grid ${getGridClass()} gap-4 md:gap-6 pb-20`}>
          {activePage?.tiles?.map(tile => (
            <Tile key={tile.id} tile={tile} onClick={handleTileClick} editMode={isEditMode} />
          ))}
          {isEditMode && (
            <button onClick={addTile} className="aspect-square rounded-2xl border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all">
              <Plus size={48} /> <span className="font-bold mt-2">Add</span>
            </button>
          )}
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Edit Tile Modal */}
      {editingTile && !showImageSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Edit Button</h3>
              <button onClick={() => setEditingTile(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Label</label>
                <input type="text" value={editingTile.label} onChange={e => setEditingTile({ ...editingTile, label: e.target.value })} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phrase</label>
                <textarea value={editingTile.phrase} onChange={e => setEditingTile({ ...editingTile, phrase: e.target.value })} className="w-full p-3 border rounded-lg" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                  <select value={editingTile.type} onChange={e => setEditingTile({ ...editingTile, type: e.target.value })} className="w-full p-3 border rounded-lg bg-white">
                    <option value="emoji">Emoji</option>
                    <option value="image">Image URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Background</label>
                  <select value={editingTile.color} onChange={e => setEditingTile({ ...editingTile, color: e.target.value })} className="w-full p-3 border rounded-lg bg-white">
                    <option value="bg-white">White</option>
                    <option value="bg-red-200">Red</option>
                    <option value="bg-blue-200">Blue</option>
                    <option value="bg-green-200">Green</option>
                    <option value="bg-yellow-200">Yellow</option>
                    <option value="bg-orange-200">Orange</option>
                    <option value="bg-purple-200">Purple</option>
                    <option value="bg-pink-200">Pink</option>
                  </select>
                </div>
              </div>

              {/* Page Linking Feature */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold uppercase text-blue-600 mb-1 flex items-center gap-1"><ArrowRightCircle size={12} /> Link to Page (Optional)</label>
                <select
                  value={editingTile.linkToPage || ""}
                  onChange={e => setEditingTile({ ...editingTile, linkToPage: e.target.value })}
                  className="w-full p-2 border rounded-md text-sm bg-white"
                >
                  <option value="">-- No Link (Stay here) --</option>
                  {config.pages.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-400 mt-1">If set, clicking this button will jump to that page.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{editingTile.type === 'emoji' ? 'Emoji' : 'Image URL'}</label>
                <div className="flex gap-2">
                  <input type="text" value={editingTile.image} onChange={e => setEditingTile({ ...editingTile, image: e.target.value })} className="flex-1 p-3 border rounded-lg text-sm" />
                  <button onClick={() => { setSearchQuery(editingTile.label || ""); setShowImageSearch(true); }} className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Search size={20} /></button>
                </div>
              </div>
              <button onClick={() => updateTile(editingTile)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Search Modal */}
      {showImageSearch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden">

            {/* Loading Overlay */}
            {isDownloading && (
              <div className="absolute inset-0 z-[70] bg-white/80 flex flex-col items-center justify-center">
                <Loader2 size={64} className="animate-spin text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Downloading Image...</h3>
                <p className="text-sm text-slate-500">Please wait while we save it offline.</p>
              </div>
            )}

            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg flex items-center gap-2"><Search size={20} className="text-blue-600" /> Search Symbols</h3>
              <button onClick={() => setShowImageSearch(false)}><X size={20} /></button>
            </div>
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2">
                <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchSymbols()} placeholder="Search..." className="flex-1 p-3 border rounded-xl" />
                <button onClick={searchSymbols} disabled={isSearching} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">{isSearching ? <Loader2 className="animate-spin" /> : "Search"}</button>
              </div>
              <div className="text-xs text-slate-400 mt-2 text-center">Click an image to select it. Images are saved offline.</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {searchResults.map((result) => (
                    <button key={result.id || result.image_url} onClick={() => selectSymbol(result.image_url)} className="aspect-square bg-white rounded-xl shadow-sm border p-2 flex flex-col items-center justify-center hover:ring-2 hover:ring-blue-200 focus:ring-2 focus:ring-blue-400 outline-none">
                      <img src={result.image_url} alt="symbol" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400"><ImageIcon size={48} className="mb-2 opacity-20" /><p>No symbols found yet.</p><p className="text-sm">Try typing a word above.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Edit Page</h3>
              <button onClick={() => { setEditingPage(null); setDeleteConfirm(false); }}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                <input type="text" value={editingPage.label} onChange={e => setEditingPage({ ...editingPage, label: e.target.value })} className="w-full p-3 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Icon</label>
                  <input type="text" value={editingPage.icon} onChange={e => setEditingPage({ ...editingPage, icon: e.target.value })} className="w-full p-3 border rounded-lg text-center" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Theme</label>
                  <select value={editingPage.color} onChange={e => setEditingPage({ ...editingPage, color: e.target.value })} className="w-full p-3 border rounded-lg bg-white">
                    <option value="bg-slate-100">Gray</option>
                    <option value="bg-blue-50">Blue</option>
                    <option value="bg-green-50">Green</option>
                    <option value="bg-purple-50">Purple</option>
                    <option value="bg-orange-50">Orange</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <button
                  onClick={() => handleExportPage(editingPage)}
                  className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline"
                >
                  <Share size={16} /> Export Page
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                {deleteConfirm ? (
                  <div className="flex flex-1 gap-2">
                    <button onClick={() => deletePage(editingPage.id)} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl">Confirm</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(true)} disabled={config.pages.length <= 1} className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl disabled:opacity-50">Delete</button>
                )}
                {!deleteConfirm && <button onClick={() => updatePage(editingPage)} className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl">Save</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Prompt */}
      {pinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <Lock className="mx-auto text-blue-600 mb-4" size={40} />
            <h3 className="font-bold text-lg mb-2">Enter Admin PIN</h3>
            <p className="text-xs text-gray-500 mb-4">
              {pinContext === 'settings' ? 'Enter PIN to access Settings' : 'Enter PIN to unlock Edit Mode'}
            </p>
            <input type="password" autoFocus value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPin()} className="w-full text-center text-2xl tracking-widest p-3 border rounded-lg mb-4" placeholder="****" />
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setPinPrompt(false); setPinContext(null); setPinInput(""); }} className="flex-1 py-2 rounded-lg bg-gray-200">Cancel</button>
              <button onClick={verifyPin} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold">Unlock</button>
            </div>
            <button onClick={handleFactoryReset} className="text-red-500 text-xs hover:underline">Forgot PIN? Factory Reset</button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Settings</h2>
            <button onClick={() => setShowSettings(false)} className="hover:text-gray-300"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* Mode Settings */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><MessageSquare size={16} /> Interaction Mode</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">Sentence Builder</div>
                    <p className="text-xs text-slate-500">Accumulate words in a strip before speaking</p>
                  </div>
                  <input type="checkbox" checked={config.settings.enableSentenceBuilder} onChange={e => updateSetting('enableSentenceBuilder', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                </div>
                {config.settings.enableSentenceBuilder && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <div className="font-bold text-sm">Speak on Select</div>
                      <p className="text-xs text-slate-500">Speak each word as it is added</p>
                    </div>
                    <input type="checkbox" checked={config.settings.speakOnSelect} onChange={e => updateSetting('speakOnSelect', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                  </div>
                )}
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><LayoutGrid size={16} /> Visuals</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Grid Size</label>
                  <select value={config.settings.gridSize || "auto"} onChange={e => updateSetting('gridSize', e.target.value === "auto" ? "auto" : parseInt(e.target.value))} className="w-full p-2 border rounded-md text-sm">
                    <option value="auto">Auto (Responsive)</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                    <option value={6}>6 Columns</option>
                    <option value={8}>8 Columns</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Show Button Labels</label>
                    <p className="text-xs text-slate-500">Hide text for a cleaner look</p>
                  </div>
                  <input type="checkbox" checked={config.settings.showLabels !== false} onChange={e => updateSetting('showLabels', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Volume2 size={16} /> Speech</h3>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-800"><WifiOff size={16} /> <span>Offline Voices Only</span></div>
                <input type="checkbox" checked={config.settings.offlineOnly} onChange={e => updateSetting('offlineOnly', e.target.checked)} className="w-5 h-5 accent-blue-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voice</label>
                  <select value={config.settings.voiceURI || ""} onChange={e => updateSetting('voiceURI', e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option value="">Default Device Voice</option>
                    {displayedVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rate</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={config.settings.rate} onChange={e => updateSetting('rate', parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pitch</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={config.settings.pitch} onChange={e => updateSetting('pitch', parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Lock size={16} /> Security</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-1">Admin PIN</label>
                <input type="text" value={config.settings.adminPin} onChange={e => updateSetting('adminPin', e.target.value)} placeholder="Leave empty for no PIN" className="w-full p-2 border rounded-md text-sm mb-2" />
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <button onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="flex items-center justify-between w-full text-sm font-bold uppercase text-slate-400 mb-3 hover:text-slate-600">
                <span className="flex items-center gap-2"><Key size={16} /> Advanced Settings</span>
                {showAdvancedSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showAdvancedSettings && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Shared Secret</label>
                    <input type="password" value={config.settings.openSymbolsSecret} onChange={e => updateSetting('openSymbolsSecret', e.target.value)} placeholder="Secret" className="w-full p-2 border rounded-md text-sm" />
                  </div>
                  <p className="text-xs text-slate-500">Required for symbol search API.</p>
                </div>
              )}
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Save size={16} /> Data & Storage</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExport} className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <Download size={24} className="mb-2 text-blue-600" /> <span className="text-sm font-medium">Backup Full</span>
                  <span className="text-xs text-slate-400">Save everything</span>
                </button>
                <button onClick={() => handleExportPage(activePage)} className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <Share size={24} className="mb-2 text-indigo-600" /> <span className="text-sm font-medium">Export Page</span>
                  <span className="text-xs text-slate-400">Save current page</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <Upload size={24} className="mb-2 text-green-600" /> <span className="text-sm font-medium">Restore</span>
                  <span className="text-xs text-slate-400">Replace all</span>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </label>

                <label className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <FilePlus size={24} className="mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Import Page</span>
                  <span className="text-xs text-slate-400">Add to board</span>
                  <input type="file" ref={mergeInputRef} onChange={handleMergeImport} accept=".json" className="hidden" />
                </label>
              </div>
            </section>

          </div>
          <div className="p-4 bg-slate-50 border-t text-center text-xs text-slate-400">Zip EasySpeak v1.0 by <span className="font-bold">Zip Solutions</span></div>
        </div>
      )}
    </div>
  );
}