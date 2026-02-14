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
  AlertCircle
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
    openSymbolsToken: "",
    gridSize: "auto",
    offlineOnly: false,
  },
  pages: [
    {
      id: "p_core",
      label: "Core",
      icon: "🏠",
      color: "bg-blue-100",
      tiles: [
        { id: "t1", label: "Yes", phrase: "Yes", image: "👍", type: "emoji", color: "bg-green-200" },
        { id: "t2", label: "No", phrase: "No", image: "👎", type: "emoji", color: "bg-red-200" },
        { id: "t3", label: "Help", phrase: "I need help please", image: "🆘", type: "emoji", color: "bg-yellow-200" },
        { id: "t4", label: "Stop", phrase: "Stop it", image: "🛑", type: "emoji", color: "bg-red-300" },
        { id: "t5", label: "Want", phrase: "I want", image: "🤲", type: "emoji", color: "bg-blue-200" },
        { id: "t6", label: "More", phrase: "I want more", image: "➕", type: "emoji", color: "bg-green-100" },
      ]
    },
    {
      id: "p_food",
      label: "Food",
      icon: "🍔",
      color: "bg-orange-50",
      tiles: [
        { id: "f1", label: "Hungry", phrase: "I am hungry", image: "😋", type: "emoji", color: "bg-orange-200" },
        { id: "f2", label: "Water", phrase: "Can I have some water?", image: "💧", type: "emoji", color: "bg-blue-100" },
        { id: "f3", label: "Apple", phrase: "I want an apple", image: "🍎", type: "emoji", color: "bg-red-100" },
        { id: "f4", label: "Snack", phrase: "I want a snack", image: "🍪", type: "emoji", color: "bg-amber-200" },
      ]
    },
    {
      id: "p_feel",
      label: "Feelings",
      icon: "😊",
      color: "bg-purple-50",
      tiles: [
        { id: "e1", label: "Happy", phrase: "I feel happy", image: "😄", type: "emoji", color: "bg-yellow-100" },
        { id: "e2", label: "Sad", phrase: "I feel sad", image: "😢", type: "emoji", color: "bg-blue-100" },
        { id: "e3", label: "Tired", phrase: "I am tired", image: "😴", type: "emoji", color: "bg-slate-200" },
        { id: "e4", label: "Mad", phrase: "I am mad", image: "😠", type: "emoji", color: "bg-red-200" },
      ]
    }
  ]
};

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activePageId, setActivePageId] = useState(DEFAULT_CONFIG.pages[0].id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // UI State
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
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Refs
  const fileInputRef = useRef(null);

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

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "zip_easyspeak_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        if (importedConfig.pages && importedConfig.settings) {
          setConfig(importedConfig);
          setActivePageId(importedConfig.pages[0].id);
          alert("Configuration loaded successfully!");
        } else {
          alert("Invalid file format.");
        }
      } catch (err) {
        alert("Error parsing file.");
      }
    };
  };

  const handleFactoryReset = () => {
    if (window.confirm("WARNING: This will wipe all pages, buttons, settings, and REMOVE the PIN. This cannot be undone. Are you sure?")) {
      setConfig(DEFAULT_CONFIG);
      setPinPrompt(false);
      setPinInput("");
      setPinContext(null);
    }
  };

  // --- Security Logic ---

  const requestAccess = (context) => {
    if (config.settings.adminPin && config.settings.adminPin.length > 0) {
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
  
  // --- Search Functions ---
  
  // Helper to determine the correct proxy URL
  const getProxyUrl = (targetUrl) => {
    // Always use the internal Cloudflare Function proxy
    return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
  };

  const searchSymbols = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    let envToken = "";
    try {
        if (import.meta && import.meta.env) {
            envToken = import.meta.env.VITE_OPENSYMBOLS_TOKEN || "";
        }
    } catch (e) {
        // Ignore in strict modes
    }

    const token = config.settings.openSymbolsToken || envToken;

    try {
      let targetUrl = `https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(searchQuery)}`;
      if (token) targetUrl += `&access_token=${token}`;

      // Use the internal proxy
      const finalUrl = getProxyUrl(targetUrl);

      const response = await fetch(finalUrl);
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) throw new Error("Access Token Required");
        throw new Error("API Error");
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed", error);
      if (error.message.includes("Access Token")) {
          alert("Access Token required. Check Settings > Advanced.");
      } else {
          alert("Could not fetch symbols. Check internet connection or CORS settings.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectSymbol = async (imageUrl) => {
    setIsSearching(true);
    try {
      // Use the internal proxy for images too
      const finalUrl = getProxyUrl(imageUrl);
      
      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingTile(prev => ({ ...prev, type: 'image', image: reader.result }));
        setShowImageSearch(false);
        setIsSearching(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Offline save failed", error);
      setEditingTile(prev => ({ ...prev, type: 'image', image: imageUrl }));
      setShowImageSearch(false);
      setIsSearching(false);
    }
  };

  // --- CRUD Operations ---

  const updateSetting = (key, value) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const addTile = () => {
    const newTile = {
      id: generateId(),
      label: "New Button",
      phrase: "New Button",
      image: "⬜",
      type: "emoji",
      color: "bg-white"
    };
    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === activePageId ? { ...p, tiles: [...p.tiles, newTile] } : p)
    }));
  };

  const updateTile = (updatedTile) => {
    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === activePageId ? { ...p, tiles: p.tiles.map(t => t.id === updatedTile.id ? updatedTile : t) } : p)
    }));
    setEditingTile(null);
  };

  const deleteTile = (tileId) => {
    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === activePageId ? { ...p, tiles: p.tiles.filter(t => t.id !== tileId) } : p)
    }));
    setEditingTile(null);
  };

  const addPage = () => {
    const newPage = { id: generateId(), label: "New Page", icon: "📄", color: "bg-gray-100", tiles: [] };
    setConfig(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageId(newPage.id);
  };

  const updatePage = (updatedPage) => {
    setConfig(prev => ({ ...prev, pages: prev.pages.map(p => p.id === updatedPage.id ? updatedPage : p) }));
    setEditingPage(null);
    setDeleteConfirm(false); 
  };

  const deletePage = (pageId) => {
    if (config.pages.length <= 1) return;
    const newPages = config.pages.filter(p => p.id !== pageId);
    let nextActiveId = activePageId;
    if (activePageId === pageId) {
        nextActiveId = newPages[0].id;
    }
    setActivePageId(nextActiveId);
    setConfig(prev => ({ ...prev, pages: newPages }));
    setEditingPage(null);
    setDeleteConfirm(false);
  };

  // --- Sub-Components (Inline) ---

  const Tile = ({ tile, onClick, editMode }) => (
    <div 
      onClick={() => !editMode && onClick(tile.phrase)}
      className={`
        relative group flex flex-col items-center justify-center 
        aspect-square rounded-2xl shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all
        cursor-pointer select-none overflow-hidden
        ${tile.color} border-black/10 hover:brightness-95
      `}
    >
      <div className="flex-1 flex items-center justify-center w-full p-2">
        {tile.type === 'image' ? (
          <img src={tile.image} alt={tile.label} className="w-full h-full object-contain pointer-events-none" />
        ) : (
          <span className="text-5xl md:text-6xl select-none">{tile.image}</span>
        )}
      </div>
      <div className="w-full text-center py-2 px-1 bg-white/30 backdrop-blur-sm font-bold text-gray-800 text-sm md:text-base truncate">
        {tile.label}
      </div>
      {editMode && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={(e) => { e.stopPropagation(); setEditingTile(tile); }} className="p-3 bg-white rounded-full shadow-lg hover:bg-blue-50 text-blue-600 mr-2"><Edit2 size={20} /></button>
          <button onClick={(e) => { e.stopPropagation(); deleteTile(tile.id); }} className="p-3 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600"><Trash2 size={20} /></button>
        </div>
      )}
    </div>
  );

  // Safely find the active page, fallback to first page if not found (e.g. during deletion)
  const activePage = config.pages.find(p => p.id === activePageId) || config.pages[0];

  const getGridClass = () => {
    const size = config.settings.gridSize;
    if (size === 2) return "grid-cols-2";
    if (size === 3) return "grid-cols-3";
    if (size === 4) return "grid-cols-4";
    if (size === 6) return "grid-cols-6";
    if (size === 8) return "grid-cols-8";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"; // Auto
  };

  // Filter voices based on settings
  const displayedVoices = config.settings.offlineOnly
    ? availableVoices.filter(v => v.localService === true)
    : availableVoices;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col md:flex-row overflow-hidden">
      
      {/* --- Sidebar (Navigation) --- */}
      <nav className="w-full md:w-24 md:h-screen bg-white shadow-xl flex md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 z-20">
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-slate-100 mb-2">
           <img src="/pwa-192x192.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm mb-1 object-cover" onError={(e) => { e.target.style.display='none'; }} />
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Zip</span>
        </div>

        <div className="p-2 md:p-4 flex md:flex-col items-center gap-2">
          {config.pages.map(page => (
            <button
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 transition-all ${activePageId === page.id ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              <span className="text-2xl mb-1">{page.icon}</span>
              <span className="text-[10px] font-bold truncate max-w-full leading-tight">{page.label}</span>
            </button>
          ))}
          
          {isEditMode && (
             <button onClick={addPage} className="flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-dashed border-green-300">
               <Plus size={24} />
               <span className="text-[10px] font-bold mt-1">Add Page</span>
             </button>
          )}
        </div>
        
        <div className="md:mt-auto p-2 md:p-4 border-t border-slate-100 flex md:flex-col items-center justify-center gap-3">
           <button 
            onClick={() => isEditMode ? setIsEditMode(false) : requestAccess('edit')}
            className={`p-3 rounded-full ${isEditMode ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
            title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          >
            {isEditMode ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
          
          <button 
            onClick={() => requestAccess('settings')}
            className="p-3 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className={`flex-1 h-[calc(100vh-80px)] md:h-screen overflow-y-auto p-4 md:p-8 transition-colors ${activePage.color}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <img src="/pwa-192x192.png" alt="Logo" className="md:hidden w-8 h-8 rounded-lg shadow-sm object-cover" onError={(e) => { e.target.style.display='none'; }} />
             <h1 className="text-3xl font-bold flex items-center gap-2">{activePage.icon} {activePage.label}</h1>
             {isEditMode && (
               <button onClick={() => setEditingPage(activePage)} className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-500"><Edit2 size={16} /></button>
             )}
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full">
            <Volume2 size={18} className="text-slate-500"/>
            <span className="text-sm font-medium text-slate-600">Voice: {config.settings.voiceURI ? 'Custom' : 'Default'}</span>
          </div>
        </div>

        <div className={`grid ${getGridClass()} gap-4 md:gap-6 pb-20`}>
          {activePage.tiles.map(tile => (
            <Tile key={tile.id} tile={tile} onClick={speak} editMode={isEditMode} />
          ))}
          {isEditMode && (
             <button onClick={addTile} className="aspect-square rounded-2xl border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all">
               <Plus size={48} />
               <span className="font-bold mt-2">Add Button</span>
             </button>
          )}
        </div>
      </main>

      {/* --- Modals --- */}

      {editingTile && !showImageSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Edit Button</h3>
              <button onClick={() => setEditingTile(null)}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Label (Seen)</label>
                <input type="text" value={editingTile.label} onChange={e => setEditingTile({...editingTile, label: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phrase (Spoken)</label>
                <textarea value={editingTile.phrase} onChange={e => setEditingTile({...editingTile, phrase: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                    <select value={editingTile.type} onChange={e => setEditingTile({...editingTile, type: e.target.value})} className="w-full p-3 border rounded-lg bg-white">
                      <option value="emoji">Emoji</option>
                      <option value="image">Image URL</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Background</label>
                    <select value={editingTile.color} onChange={e => setEditingTile({...editingTile, color: e.target.value})} className="w-full p-3 border rounded-lg bg-white">
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

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{editingTile.type === 'emoji' ? 'Emoji' : 'Image URL'}</label>
                <div className="flex gap-2">
                  <input type="text" value={editingTile.image} onChange={e => setEditingTile({...editingTile, image: e.target.value})} className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder={editingTile.type === 'emoji' ? 'Paste emoji here' : 'https://...'} />
                  <button onClick={() => { setSearchQuery(editingTile.label || ""); setShowImageSearch(true); }} className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" title="Search for Symbol"><Search size={20} /></button>
                </div>
              </div>
              <button onClick={() => updateTile(editingTile)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors mt-2">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      
      {showImageSearch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-lg flex items-center gap-2"><Search size={20} className="text-blue-600"/> Search Symbols</h3>
               <button onClick={() => setShowImageSearch(false)}><X size={20}/></button>
             </div>
             <div className="p-4 border-b bg-white">
                <div className="flex gap-2">
                  <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchSymbols()} placeholder="Search for a symbol (e.g. 'cat', 'eat')" className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button onClick={searchSymbols} disabled={isSearching} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">{isSearching ? <Loader2 className="animate-spin"/> : "Search"}</button>
                </div>
                <div className="text-xs text-slate-400 mt-2 text-center">Powered by OpenSymbols • Images will be saved offline</div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
               {isSearching && searchResults.length === 0 ? (
                 <div className="flex h-full items-center justify-center text-slate-400"><Loader2 size={40} className="animate-spin mb-2" /></div>
               ) : searchResults.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                   {searchResults.map((result) => (
                     <button key={result.id || result.image_url} onClick={() => selectSymbol(result.image_url)} className="aspect-square bg-white rounded-xl shadow-sm border hover:border-blue-500 hover:ring-2 hover:ring-blue-200 p-2 flex flex-col items-center justify-center transition-all group">
                       <img src={result.image_url} alt={result.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy" referrerPolicy="no-referrer" />
                       <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">{result.name}</span>
                     </button>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400"><ImageIcon size={48} className="mb-2 opacity-20"/><p>No symbols found yet.</p><p className="text-sm">Try typing a word above.</p></div>
               )}
             </div>
           </div>
        </div>
      )}

      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Edit Page</h3>
              <button onClick={() => { setEditingPage(null); setDeleteConfirm(false); }}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Page Name</label>
                <input type="text" value={editingPage.label} onChange={e => setEditingPage({...editingPage, label: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Icon</label>
                    <input type="text" value={editingPage.icon} onChange={e => setEditingPage({...editingPage, icon: e.target.value})} className="w-full p-3 border rounded-lg text-center" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Theme</label>
                    <select value={editingPage.color} onChange={e => setEditingPage({...editingPage, color: e.target.value})} className="w-full p-3 border rounded-lg bg-white">
                      <option value="bg-slate-100">Gray</option>
                      <option value="bg-blue-50">Blue</option>
                      <option value="bg-green-50">Green</option>
                      <option value="bg-purple-50">Purple</option>
                      <option value="bg-orange-50">Orange</option>
                    </select>
                 </div>
              </div>
              <div className="flex gap-2 pt-2">
                 {deleteConfirm ? (
                   <div className="flex flex-1 gap-2">
                     <button onClick={() => deletePage(editingPage.id)} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors animate-in fade-in zoom-in duration-200">Confirm</button>
                     <button onClick={() => setDeleteConfirm(false)} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">Cancel</button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setDeleteConfirm(true)} 
                     disabled={config.pages.length <= 1}
                     className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     <Trash2 size={18}/> Delete
                   </button>
                 )}
                 
                 {!deleteConfirm && (
                   <button onClick={() => updatePage(editingPage)} className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                     <Check size={18}/> Save
                   </button>
                 )}
              </div>
              
              {config.pages.length <= 1 && (
                <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
                  <AlertCircle size={12}/> Cannot delete the last page
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20}/> Settings</h2>
            <button onClick={() => setShowSettings(false)} className="hover:text-gray-300"><X size={24}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Visuals */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><LayoutGrid size={16}/> Visuals</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Grid Size</label>
                <select value={config.settings.gridSize || "auto"} onChange={e => updateSetting('gridSize', e.target.value === "auto" ? "auto" : parseInt(e.target.value))} className="w-full p-2 border rounded-md text-sm">
                  <option value="auto">Auto (Responsive)</option>
                  <option value={2}>2 Columns (Very Large)</option>
                  <option value={3}>3 Columns (Large)</option>
                  <option value={4}>4 Columns (Medium)</option>
                  <option value={6}>6 Columns (Small)</option>
                  <option value={8}>8 Columns (Tiny)</option>
                </select>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Voice Settings */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Volume2 size={16}/> Speech</h3>
              
              {/* Added Offline Toggle */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                    <WifiOff size={16} />
                    <span>Offline Voices Only</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-0.5">Hide voices that need internet</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.settings.offlineOnly}
                  onChange={e => updateSetting('offlineOnly', e.target.checked)}
                  className="w-5 h-5 accent-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voice</label>
                  <select value={config.settings.voiceURI || ""} onChange={e => updateSetting('voiceURI', e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option value="">Default Device Voice</option>
                    {displayedVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rate (Speed)</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={config.settings.rate} onChange={e => updateSetting('rate', parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pitch</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={config.settings.pitch} onChange={e => updateSetting('pitch', parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>
                <button onClick={() => speak("This is a test of the selected voice.")} className="text-sm text-blue-600 font-medium hover:underline">Test Voice</button>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Security */}
            <section>
               <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Lock size={16}/> Security</h3>
               <div className="bg-slate-50 p-4 rounded-lg">
                 <label className="block text-sm font-medium mb-1">Admin PIN</label>
                 <input type="text" value={config.settings.adminPin} onChange={e => updateSetting('adminPin', e.target.value)} placeholder="Leave empty for no PIN" className="w-full p-2 border rounded-md text-sm mb-2" />
                 <p className="text-xs text-slate-500">Locks Edit Mode AND Settings menu.</p>
               </div>
            </section>

            <hr className="border-slate-100" />
            
             {/* Advanced / API Keys */}
            <section>
               <button 
                 onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                 className="flex items-center justify-between w-full text-sm font-bold uppercase text-slate-400 mb-3 hover:text-slate-600"
               >
                 <span className="flex items-center gap-2"><Key size={16}/> Advanced Settings</span>
                 {showAdvancedSettings ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
               </button>
               
               {showAdvancedSettings && (
                 <div className="bg-slate-50 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                   <label className="block text-sm font-medium mb-1">OpenSymbols Access Token</label>
                   <input 
                      type="text" 
                      value={config.settings.openSymbolsToken}
                      onChange={e => updateSetting('openSymbolsToken', e.target.value)}
                      placeholder="Optional Access Token"
                      className="w-full p-2 border rounded-md text-sm mb-2"
                   />
                   <p className="text-xs text-slate-500">
                     Required for symbol search API.
                   </p>
                 </div>
               )}
            </section>

            <hr className="border-slate-100" />

            {/* Data Management */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Save size={16}/> Data & Storage</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExport} className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <Download size={24} className="mb-2 text-blue-600" />
                  <span className="text-sm font-medium">Backup</span>
                  <span className="text-xs text-slate-400">Save to device</span>
                </button>
                <label className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <Upload size={24} className="mb-2 text-green-600" />
                  <span className="text-sm font-medium">Restore</span>
                  <span className="text-xs text-slate-400">Load backup</span>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </label>
              </div>
            </section>

          </div>
          <div className="p-4 bg-slate-50 border-t text-center text-xs text-slate-400">
            Zip EasySpeak v1.0 by <span className="font-bold"><a href="https://zipsolutions.org">Zip Solutions</a></span>
          </div>
        </div>
      )}

    </div>
  );
}