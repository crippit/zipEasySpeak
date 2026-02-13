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
  Zap // Kept for reference, though we are swapping the logo
} from 'lucide-react';

/**
 * Zip EasySpeak AAC
 * Developed by Zip Solutions
 * A single-file React application for Augmentative and Alternative Communication.
 */

// --- Default Configuration Data ---
const DEFAULT_CONFIG = {
  version: 1,
  settings: {
    voiceURI: null, // Uses default if null
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    adminPin: "", // Empty means no password
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
  // --- State ---
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activePageId, setActivePageId] = useState(DEFAULT_CONFIG.pages[0].id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [editingTile, setEditingTile] = useState(null); // Tile object or null
  const [editingPage, setEditingPage] = useState(null); // Page object or null
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");

  // Refs
  const fileInputRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    // Load voices
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
    
    // Cancel current speech to avoid queue buildup
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply settings
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

  const attemptEnterEditMode = () => {
    if (config.settings.adminPin && config.settings.adminPin.length > 0) {
      setPinPrompt(true);
    } else {
      setIsEditMode(true);
    }
  };

  const verifyPin = () => {
    if (pinInput === config.settings.adminPin) {
      setIsEditMode(true);
      setPinPrompt(false);
      setPinInput("");
    } else {
      alert("Incorrect PIN");
      setPinInput("");
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
      pages: prev.pages.map(p => {
        if (p.id === activePageId) {
          return { ...p, tiles: [...p.tiles, newTile] };
        }
        return p;
      })
    }));
  };

  const updateTile = (updatedTile) => {
    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => {
        if (p.id === activePageId) {
          return { ...p, tiles: p.tiles.map(t => t.id === updatedTile.id ? updatedTile : t) };
        }
        return p;
      })
    }));
    setEditingTile(null);
  };

  const deleteTile = (tileId) => {
    if (!window.confirm("Delete this button?")) return;
    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => {
        if (p.id === activePageId) {
          return { ...p, tiles: p.tiles.filter(t => t.id !== tileId) };
        }
        return p;
      })
    }));
    setEditingTile(null);
  };

  const addPage = () => {
    const newPage = {
      id: generateId(),
      label: "New Page",
      icon: "📄",
      color: "bg-gray-100",
      tiles: []
    };
    setConfig(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageId(newPage.id);
  };

  const updatePage = (updatedPage) => {
    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === updatedPage.id ? updatedPage : p)
    }));
    setEditingPage(null);
  };

  const deletePage = (pageId) => {
    if (config.pages.length <= 1) {
      alert("You must have at least one page.");
      return;
    }
    if (!window.confirm("Delete this entire page and all its buttons?")) return;
    
    const newPages = config.pages.filter(p => p.id !== pageId);
    setConfig(prev => ({ ...prev, pages: newPages }));
    setActivePageId(newPages[0].id);
    setEditingPage(null);
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
      {/* Content */}
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

      {/* Edit Mode Overlays */}
      {editMode && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); setEditingTile(tile); }}
            className="p-3 bg-white rounded-full shadow-lg hover:bg-blue-50 text-blue-600 mr-2"
          >
            <Edit2 size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteTile(tile.id); }}
            className="p-3 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  );

  const activePage = config.pages.find(p => p.id === activePageId) || config.pages[0];

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col md:flex-row overflow-hidden">
      
      {/* --- Sidebar (Navigation) --- */}
      <nav className="w-full md:w-24 md:h-screen bg-white shadow-xl flex md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 z-20">
        
        {/* Branding (Top of Sidebar) */}
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-slate-100 mb-2">
           {/* Replaced Zap Icon with PWA Image */}
           <img 
             src="/pwa-192x192.png" 
             alt="Logo" 
             className="w-10 h-10 rounded-xl shadow-sm mb-1 object-cover" 
             onError={(e) => { e.target.style.display='none'; }} // Fallback if image fails to load
           />
           {/* Fallback text if image fails or just for text branding */}
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Zip</span>
        </div>

        <div className="p-2 md:p-4 flex md:flex-col items-center gap-2">
          {config.pages.map(page => (
            <button
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 transition-all
                ${activePageId === page.id ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}
              `}
            >
              <span className="text-2xl mb-1">{page.icon}</span>
              <span className="text-[10px] font-bold truncate max-w-full leading-tight">{page.label}</span>
            </button>
          ))}
          
          {isEditMode && (
             <button
             onClick={addPage}
             className="flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-dashed border-green-300"
           >
             <Plus size={24} />
             <span className="text-[10px] font-bold mt-1">Add Page</span>
           </button>
          )}
        </div>
        
        <div className="md:mt-auto p-2 md:p-4 border-t border-slate-100 flex md:flex-col items-center justify-center gap-3">
           <button 
            onClick={() => isEditMode ? setIsEditMode(false) : attemptEnterEditMode()}
            className={`p-3 rounded-full ${isEditMode ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
            title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          >
            {isEditMode ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className={`flex-1 h-[calc(100vh-80px)] md:h-screen overflow-y-auto p-4 md:p-8 transition-colors ${activePage.color}`}>
        
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             {/* Mobile Logo Replacement */}
             <img 
               src="/pwa-192x192.png" 
               alt="Logo" 
               className="md:hidden w-8 h-8 rounded-lg shadow-sm object-cover"
               onError={(e) => { e.target.style.display='none'; }} 
             />
             <h1 className="text-3xl font-bold flex items-center gap-2">
               {activePage.icon} {activePage.label}
             </h1>
             {isEditMode && (
               <button 
                 onClick={() => setEditingPage(activePage)}
                 className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-500"
                >
                 <Edit2 size={16} />
               </button>
             )}
          </div>
          
          {/* Quick Speak Bar */}
          <div className="hidden md:flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full">
            <Volume2 size={18} className="text-slate-500"/>
            <span className="text-sm font-medium text-slate-600">Voice: {config.settings.voiceURI ? 'Custom' : 'Default'}</span>
          </div>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 pb-20">
          {activePage.tiles.map(tile => (
            <Tile key={tile.id} tile={tile} onClick={speak} editMode={isEditMode} />
          ))}
          
          {isEditMode && (
             <button 
             onClick={addTile}
             className="aspect-square rounded-2xl border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all"
           >
             <Plus size={48} />
             <span className="font-bold mt-2">Add Button</span>
           </button>
          )}
        </div>
      </main>

      {/* --- Modals --- */}

      {/* 1. Edit Tile Modal */}
      {editingTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Edit Button</h3>
              <button onClick={() => setEditingTile(null)}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Label (Seen)</label>
                <input 
                  type="text" 
                  value={editingTile.label} 
                  onChange={e => setEditingTile({...editingTile, label: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phrase (Spoken)</label>
                <textarea 
                  value={editingTile.phrase} 
                  onChange={e => setEditingTile({...editingTile, phrase: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                    <select 
                      value={editingTile.type}
                      onChange={e => setEditingTile({...editingTile, type: e.target.value})}
                      className="w-full p-3 border rounded-lg bg-white"
                    >
                      <option value="emoji">Emoji</option>
                      <option value="image">Image URL</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Background</label>
                    <select 
                      value={editingTile.color}
                      onChange={e => setEditingTile({...editingTile, color: e.target.value})}
                      className="w-full p-3 border rounded-lg bg-white"
                    >
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
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  {editingTile.type === 'emoji' ? 'Emoji' : 'Image URL'}
                </label>
                <input 
                  type="text" 
                  value={editingTile.image} 
                  onChange={e => setEditingTile({...editingTile, image: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={editingTile.type === 'emoji' ? 'Paste emoji here' : 'https://...'}
                />
              </div>

              <button 
                onClick={() => updateTile(editingTile)}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors mt-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Page Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Edit Page</h3>
              <button onClick={() => setEditingPage(null)}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Page Name</label>
                <input 
                  type="text" 
                  value={editingPage.label} 
                  onChange={e => setEditingPage({...editingPage, label: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Icon</label>
                    <input 
                      type="text" 
                      value={editingPage.icon} 
                      onChange={e => setEditingPage({...editingPage, icon: e.target.value})}
                      className="w-full p-3 border rounded-lg text-center"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Theme</label>
                    <select 
                      value={editingPage.color}
                      onChange={e => setEditingPage({...editingPage, color: e.target.value})}
                      className="w-full p-3 border rounded-lg bg-white"
                    >
                      <option value="bg-slate-100">Gray</option>
                      <option value="bg-blue-50">Blue</option>
                      <option value="bg-green-50">Green</option>
                      <option value="bg-purple-50">Purple</option>
                      <option value="bg-orange-50">Orange</option>
                    </select>
                 </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                 <button 
                  onClick={() => deletePage(editingPage.id)}
                  className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => updatePage(editingPage)}
                  className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PIN Prompt */}
      {pinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
             <Lock className="mx-auto text-blue-600 mb-4" size={40} />
             <h3 className="font-bold text-lg mb-4">Enter Admin PIN</h3>
             <input 
                type="password" 
                autoFocus
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyPin()}
                className="w-full text-center text-2xl tracking-widest p-3 border rounded-lg mb-4"
                placeholder="****"
             />
             <div className="flex gap-2">
               <button onClick={() => setPinPrompt(false)} className="flex-1 py-2 rounded-lg bg-gray-200">Cancel</button>
               <button onClick={verifyPin} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold">Unlock</button>
             </div>
           </div>
        </div>
      )}

      {/* 4. Settings Panel */}
      {showSettings && (
        <div className="fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20}/> Settings</h2>
            <button onClick={() => setShowSettings(false)} className="hover:text-gray-300"><X size={24}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Voice Settings */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Volume2 size={16}/> Speech</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voice</label>
                  <select 
                    value={config.settings.voiceURI || ""} 
                    onChange={e => updateSetting('voiceURI', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="">Default Device Voice</option>
                    {availableVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rate (Speed)</label>
                    <input 
                      type="range" min="0.5" max="2" step="0.1"
                      value={config.settings.rate}
                      onChange={e => updateSetting('rate', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pitch</label>
                    <input 
                      type="range" min="0.5" max="2" step="0.1"
                      value={config.settings.pitch}
                      onChange={e => updateSetting('pitch', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => speak("This is a test of the selected voice.")}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Test Voice
                </button>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Security */}
            <section>
               <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Lock size={16}/> Security</h3>
               <div className="bg-slate-50 p-4 rounded-lg">
                 <label className="block text-sm font-medium mb-1">Admin PIN (for Edit Mode)</label>
                 <input 
                    type="text" 
                    value={config.settings.adminPin}
                    onChange={e => updateSetting('adminPin', e.target.value)}
                    placeholder="Leave empty for no PIN"
                    className="w-full p-2 border rounded-md text-sm mb-2"
                 />
                 <p className="text-xs text-slate-500">
                   If set, this PIN will be required to unlock Edit Mode.
                 </p>
               </div>
            </section>

            <hr className="border-slate-100" />

            {/* Data Management */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Save size={16}/> Data & Storage</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleExport}
                  className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download size={24} className="mb-2 text-blue-600" />
                  <span className="text-sm font-medium">Backup File</span>
                  <span className="text-xs text-slate-400">Save to device</span>
                </button>

                <label className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <Upload size={24} className="mb-2 text-green-600" />
                  <span className="text-sm font-medium">Import File</span>
                  <span className="text-xs text-slate-400">Load backup</span>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".json"
                    className="hidden"
                  />
                </label>
              </div>
            </section>

          </div>
          <div className="p-4 bg-slate-50 border-t text-center text-xs text-slate-400">
            Zip EasySpeak v1.0 by <span className="font-bold">Zip Solutions</span>
          </div>
        </div>
      )}

    </div>
  );
}