"use client";

import React, { useEffect, useState, use } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { ArrowLeft, Pin, FileText, ChevronDown, ChevronRight, ChevronLeft, Sidebar, Code, Plus, Send, Edit2, Check, Trash2, FolderPlus, X, FolderOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { getVaultHandle, readTextFile, writeTextFile, deleteFile, getPdfUrl, scanModules, getVaultCategories, ModuleData } from '@/lib/fs-helper';
import { CodexExportButton } from '@/components/CodexExport';
import { Button } from '@/components/ui/button';

interface VaultCategory {
  name: string;
  items: string[];
}

function MathVaultCategory({ category, onDeleteCategory, onRenameCategory, onUpdateItems }: { category: VaultCategory, onDeleteCategory: (name: string) => void, onRenameCategory: (old: string, newN: string) => Promise<void>, onUpdateItems: (name: string, items: string[]) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<string[]>(category.items);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(category.name);

  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);
  const [editBlockContent, setEditBlockContent] = useState('');

  useEffect(() => {
    setItems(category.items);
    setEditNameValue(category.name);
  }, [category]);

  const handleSaveItem = async () => {
    if (!newContent.trim()) return;
    try {
      const updatedItems = [...items, newContent];
      await onUpdateItems(category.name, updatedItems);
      setItems(updatedItems);
      setNewContent('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBlock = async (index: number) => {
    if (!editBlockContent.trim()) return;
    try {
      const updatedItems = [...items];
      updatedItems[index] = editBlockContent;
      await onUpdateItems(category.name, updatedItems);
      setItems(updatedItems);
      setEditingBlockIdx(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!confirm('Delete this math block permanently?')) return;
    const updatedItems = items.filter((_, i) => i !== index);
    try {
      await onUpdateItems(category.name, updatedItems);
      setItems(updatedItems);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden shadow-sm transition-all">
      <div className="w-full flex items-center justify-between hover:bg-accent transition-colors group">
        <div className="flex-1 flex items-center px-5">
          {isEditingName ? (
            <div className="flex-1 flex items-center gap-2 py-3" onClick={e => e.stopPropagation()}>
              <input 
                value={editNameValue} 
                onChange={e => setEditNameValue(e.target.value)} 
                className="bg-background border border-primary/50 rounded px-2 py-1.5 text-foreground font-bold text-lg focus:outline-none w-full max-w-[200px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRenameCategory(category.name, editNameValue).then(() => setIsEditingName(false));
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setEditNameValue(category.name);
                  }
                }}
              />
              <button onClick={() => onRenameCategory(category.name, editNameValue).then(() => setIsEditingName(false))} className="text-primary dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5"><Check size={16}/></button>
              <button onClick={() => { setIsEditingName(false); setEditNameValue(category.name); }} className="text-muted-foreground hover:text-muted-foreground p-1.5"><X size={16}/></button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between py-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
              <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {category.name} <span className="text-xs text-muted-foreground/80 font-mono">({items.length})</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground/90 ml-2 transition-all p-1"
                >
                  <Edit2 size={14} />
                </button>
              </h3>
              {isOpen ? <ChevronDown size={20} className="text-primary dark:text-blue-500"/> : <ChevronRight size={20} className="text-muted-foreground"/>}
            </div>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.name); }}
          className="p-5 text-muted-foreground/80 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          title="Delete Category"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isOpen && (
        <div className="p-5 border-t border-border bg-background/60">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic mb-4">No entries found. Add your first block!</p>
          ) : (
            <div className="flex flex-col gap-4 mb-6">
              {items.map((block, idx) => (
                <div key={idx} className="p-5 bg-secondary rounded-xl border border-border dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] relative group">
                  {editingBlockIdx === idx ? (
                    <div className="relative">
                      <textarea 
                        value={editBlockContent}
                        onChange={e => setEditBlockContent(e.target.value)}
                        className="w-full bg-background border border-primary/40 rounded-lg p-4 text-foreground text-sm font-mono leading-relaxed min-h-[160px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 mb-4"
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingBlockIdx(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2">Cancel</button>
                        <button onClick={() => handleUpdateBlock(idx)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                        <button 
                          onClick={() => { setEditingBlockIdx(idx); setEditBlockContent(block); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary dark:text-blue-400 hover:bg-secondary"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1.5 rounded-md text-muted-foreground/80 hover:text-red-400 hover:bg-secondary"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="prose dark:prose-invert prose-slate prose-sm max-w-none text-foreground/90 pr-12">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {block}
                        </ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-sm font-medium text-primary dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:bg-blue-900/20 rounded-lg px-3 py-2 transition-colors"
            >
              <Plus size={16} /> Add Entry
            </button>
          ) : (
            <div className="bg-secondary p-5 rounded-xl border border-primary/40 shadow-lg dark:shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <label className="block text-xs font-semibold text-primary dark:text-blue-400 mb-3 uppercase tracking-wider">Markdown & LaTeX Input</label>
              <textarea 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full bg-background border border-input rounded-lg p-4 text-foreground text-sm font-mono leading-relaxed min-h-[160px] focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 mb-4 transition-all"
                placeholder="e.g. Let $V$ be a vector space over field $F$..."
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveItem}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md dark:shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                >
                  <Send size={14} /> Save Block
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function ModuleSplitView({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vaultHandle, setVaultHandle] = useState<any>(null);
  const [needsVault, setNeedsVault] = useState(false);
  
  // File streaming states
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null);
  
  // 3-Panel Layout State
  const [activeSide, setActiveSide] = useState<'nav' | 'vault'>('nav');

  // Pinboard States
  const [pinboardContent, setPinboardContent] = useState<string>("Loading pinboard...");
  const [isEditingPinboard, setIsEditingPinboard] = useState(false);
  const [editPinboardText, setEditPinboardText] = useState("");

  // Vault States
  const [vaultCategories, setVaultCategories] = useState<VaultCategory[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    lectureNotes: true,
    problemSheets: true,
    pastPapers: false,
    textbooks: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchVault = async (vHandle: FileSystemDirectoryHandle, modName: string) => {
    try {
      const categories = await getVaultCategories(vHandle, modName);
      setVaultCategories(categories);
    } catch (e) {
      console.error("Failed to load vault", e);
    }
  };

  const loadData = async (handle?: any) => {
    setIsLoading(true);
    try {
      const vHandle = handle || await getVaultHandle(false);
      if (!vHandle) {
        setNeedsVault(true);
        setIsLoading(false);
        return;
      }
      setVaultHandle(vHandle);
      setNeedsVault(false);
      
      const modules = await scanModules(vHandle);
      const decodedName = decodeURIComponent(slug);
      const found = modules.find(m => m.name === decodedName);
      
      if (found) {
        setModuleData(found);
        await fetchVault(vHandle, found.name);

        // Fetch Pinboard
        try {
          const modulesDir = await vHandle.getDirectoryHandle('Modules');
          const moduleDir = await modulesDir.getDirectoryHandle(found.name);
          const pinText = await readTextFile(moduleDir, 'Pinboard.md');
          if (pinText) {
            const cleanText = pinText.replace(/^---\n[\s\S]*?\n---\n/, '');
            setPinboardContent(cleanText);
            setEditPinboardText(cleanText);
          } else {
            setPinboardContent("No Pinboard.md found in the root of this module. Create one in Obsidian to see notes here.");
            setEditPinboardText("");
          }
        } catch (pinErr) {
          setPinboardContent("Error loading Pinboard.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleSelectVault = async () => {
    const handle = await getVaultHandle(true);
    if (handle) {
      loadData(handle);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading workspace...</div>;
  }

  // --- Handlers ---
  
  const handleFileClick = async (fileName: string, categoryFolder: string) => {
    if (!moduleData || !vaultHandle) return;
    setActiveFileName(fileName);
    
    try {
      const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
      const moduleDir = await modulesDir.getDirectoryHandle(moduleData.name);
      let targetDir = moduleDir;
      if (categoryFolder) {
        targetDir = await moduleDir.getDirectoryHandle(categoryFolder);
      }
      
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const url = await getPdfUrl(targetDir, fileName);
        setActiveFileUrl(url);
      } else {
        // Can read text files and render them here if needed
        setActiveFileUrl(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePinboard = async () => {
    if (!vaultHandle || !moduleData) return;
    try {
      const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
      const moduleDir = await modulesDir.getDirectoryHandle(moduleData.name);
      await writeTextFile(moduleDir, 'Pinboard.md', editPinboardText);
      setPinboardContent(editPinboardText);
      setIsEditingPinboard(false);
    } catch (e) {
      console.error("Failed to save pinboard", e);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !vaultHandle || !moduleData) return;
    try {
      const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
      const moduleDir = await modulesDir.getDirectoryHandle(moduleData.name);
      await writeTextFile(moduleDir, `${newCategoryName}.md`, '');
      setNewCategoryName('');
      setIsAddingCategory(false);
      await fetchVault(vaultHandle, moduleData.name);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!vaultHandle || !moduleData || !confirm(`Are you sure you want to delete ${categoryName}.md?`)) return;
    try {
      const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
      const moduleDir = await modulesDir.getDirectoryHandle(moduleData.name);
      await deleteFile(moduleDir, `${categoryName}.md`);
      await fetchVault(vaultHandle, moduleData.name);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName || !vaultHandle || !moduleData) return;
    try {
      const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
      const moduleDir = await modulesDir.getDirectoryHandle(moduleData.name);
      
      const content = await readTextFile(moduleDir, `${oldName}.md`);
      await writeTextFile(moduleDir, `${newName}.md`, content);
      await deleteFile(moduleDir, `${oldName}.md`);
      
      await fetchVault(vaultHandle, moduleData.name);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCategoryItems = async (categoryName: string, items: string[]) => {
    if (!vaultHandle || !moduleData) return;
    try {
      const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
      const moduleDir = await modulesDir.getDirectoryHandle(moduleData.name);
      await writeTextFile(moduleDir, `${categoryName}.md`, items.join('\n\n---\n\n'));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const renderResourceList = (title: string, key: keyof ModuleData['resources'], folderName: string) => {
    if (!moduleData) return null;
    const files = moduleData.resources[key];
    if (!files || files.length === 0) return null;
    const isExpanded = expandedSections[key];

    return (
      <div className="mb-4">
        <button 
          onClick={() => toggleSection(key)}
          className="flex items-center justify-between w-full text-left font-medium text-foreground/90 hover:text-foreground transition-colors py-2"
        >
          <span>{title} <span className="text-xs text-muted-foreground ml-2 font-mono bg-secondary px-1.5 py-0.5 rounded">{files.length}</span></span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isExpanded && (
          <div className="flex flex-col gap-1 mt-2">
            {files.map((file, idx) => (
              <div 
                key={idx}
                onClick={() => handleFileClick(file, folderName)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                  activeFileName === file 
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 border border-primary/30 shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
                }`}
              >
                <FileText size={14} className="shrink-0" />
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (needsVault) {
    return (
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden relative">
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
           <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-lg text-center flex flex-col items-center gap-6">
             <div className="bg-primary/10 p-4 rounded-full">
               <FolderOpen size={48} className="text-primary" />
             </div>
             <div>
               <h2 className="text-2xl font-bold tracking-tight mb-2">Connect Your Vault</h2>
               <p className="text-muted-foreground text-sm">To enable the local-first architecture, please select your Obsidian Academics folder.</p>
             </div>
             <Button onClick={handleSelectVault} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-md">
               Select Obsidian Academics Vault
             </Button>
           </div>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-foreground">
        <h1 className="text-3xl font-black mb-4">Module not found</h1>
        <Link href="/" className="text-primary dark:text-blue-500 hover:text-primary dark:text-blue-400 flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans relative">
      
      {/* 1. LEFT NAVIGATION PANEL */}
      <div 
        className={`${
          activeSide === 'nav' ? 'ml-0' : '-ml-[450px]'
        } w-[450px] flex flex-col border-r border-border bg-background shrink-0 transition-all duration-300 ease-in-out relative z-20 h-full`}
      >
        <div className="min-w-[450px] h-full flex flex-col overflow-hidden">
          <div className="p-8 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground/90 transition-colors font-medium">
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
            <div className="relative mb-2">
              <h1 className="text-5xl lg:text-6xl font-black text-foreground tracking-tighter leading-none">{moduleData.name}</h1>
            </div>
            <div className="w-16 h-1.5 bg-primary rounded-full shadow-md dark:shadow-[0_0_15px_rgba(37,99,235,0.6)] mt-6 mb-6"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            
            {/* PINBOARD */}
            <div className="bg-card border border-border rounded-xl p-5 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold tracking-wide text-xs uppercase">
                  <Pin size={14} /> Pinboard
                </div>
                {!isEditingPinboard ? (
                  <button onClick={() => setIsEditingPinboard(true)} className="text-muted-foreground hover:text-foreground/90 transition-colors p-1 rounded hover:bg-secondary">
                    <Edit2 size={14} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingPinboard(false)} className="text-muted-foreground hover:text-foreground/90 transition-colors p-1 rounded hover:bg-secondary">
                      <X size={14} />
                    </button>
                    <button onClick={handleSavePinboard} className="text-primary dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-100 dark:bg-blue-900/20">
                      <Check size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {!isEditingPinboard ? (
                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-mono bg-background/50 p-4 rounded-lg border border-border max-h-64 overflow-y-auto custom-scrollbar">
                  {pinboardContent || "No content."}
                </div>
              ) : (
                <textarea 
                  value={editPinboardText}
                  onChange={e => setEditPinboardText(e.target.value)}
                  className="w-full text-sm text-foreground font-mono bg-background p-4 rounded-lg border border-primary/50 min-h-[160px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              )}
            </div>

            {/* SYLLABUS FILES */}
            <div className="mb-8">
              {renderResourceList('Lecture Notes', 'lectureNotes', 'Lecture Notes')}
              {renderResourceList('Problem Sheets', 'problemSheets', 'Problem Sheets')}
              {renderResourceList('Past Papers', 'pastPapers', 'Past Papers')}
              {renderResourceList('Textbooks', 'textbooks', 'Textbooks')}
            </div>
            
            {/* EXPORT CODEX SECTION */}
            <div className="mt-auto pt-6 border-t border-border flex justify-center">
               <CodexExportButton moduleName={moduleData.name} categories={vaultCategories} />
            </div>

          </div>
        </div>
      </div>

      {/* 2. CENTER DOCUMENT VIEWER */}
      <div className="flex-1 bg-secondary flex flex-col relative h-full min-w-0 transition-all duration-300 ease-in-out">
        {/* Toggle Right Panel Button */}
        {activeSide === 'nav' && (
          <button 
            onClick={() => setActiveSide('vault')}
            className="absolute top-4 right-4 z-50 bg-card/80 backdrop-blur-md border border-input text-amber-500 hover:text-foreground hover:bg-secondary px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 font-medium text-sm"
          >
            <Code size={16} /> Open Math Vault <ChevronLeft size={16} className="rotate-180" />
          </button>
        )}

        {/* Viewer Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeFileUrl ? (
            <iframe 
              src={activeFileUrl} 
              className="w-full h-full border-none bg-white" 
              title={activeFileName || 'Document Viewer'} 
            />
          ) : (
            <div className="flex-1 h-full flex items-center justify-center flex-col text-muted-foreground/80">
              <FileText size={64} className="mb-6 opacity-20" />
              <p className="text-xl tracking-wide text-muted-foreground font-medium">Document Viewer</p>
              <p className="text-sm mt-2 text-muted-foreground/80">Select a file from the left navigation panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT MATH VAULT PANEL */}
      <div 
        className={`${
          activeSide === 'vault' ? 'mr-0' : '-mr-[450px]'
        } w-[450px] flex flex-col border-l border-border bg-background shrink-0 transition-all duration-300 ease-in-out relative z-20 h-full`}
      >
        <div className="min-w-[450px] h-full flex flex-col overflow-hidden">
          
          <div className="p-8 pb-4 shrink-0 border-b border-border bg-background">
            <div className="flex items-center justify-between mb-6">
               <button 
                onClick={() => setActiveSide('nav')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/60 px-3 py-1.5 rounded-lg transition-colors"
               >
                 <ChevronRight size={16} /> Close Vault
               </button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Code size={28} className="text-amber-500" />
              <h2 className="text-3xl font-black text-foreground tracking-tight">Math Vault</h2>
            </div>
            <p className="text-sm text-muted-foreground">Local LaTeX repository for <strong className="text-foreground">{moduleData.name}</strong>.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            
            {vaultCategories.map(cat => (
              <MathVaultCategory key={cat.name} category={cat} onDeleteCategory={handleDeleteCategory} onRenameCategory={handleRenameCategory} onUpdateItems={handleUpdateCategoryItems} />
            ))}

            {/* Add Category Section */}
            {!isAddingCategory ? (
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border hover:border-input rounded-xl text-muted-foreground hover:text-foreground/90 transition-colors font-medium text-sm mt-4"
              >
                <FolderPlus size={16} /> Create New Category
              </button>
            ) : (
              <div className="mt-4 p-5 rounded-xl border border-primary/30 bg-card">
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Category Name</label>
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg p-3 text-foreground text-sm focus:outline-none focus:border-primary mb-3"
                  placeholder="e.g. Corollaries"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingCategory(false)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Cancel</button>
                  <button onClick={handleCreateCategory} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">Create</button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
