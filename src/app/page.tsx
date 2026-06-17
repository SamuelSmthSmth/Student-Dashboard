"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Briefcase, Plus, Check, X, Book, MoreVertical, Trash2, Edit2, Calendar, FolderOpen 
} from 'lucide-react';
import { CalendarWidget } from '@/components/calendar-widget';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getVaultHandle, scanModules, readJsonFile, writeJsonFile, ModuleData } from '@/lib/fs-helper';

interface DashboardConfig {
  categories: Record<string, string[]>;
  defaultCategory: string;
  calendarUrl?: string;
}

export default function DashboardTemplate() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [config, setConfig] = useState<DashboardConfig>({ categories: {}, defaultCategory: 'Uncategorized' });
  const [isLoading, setIsLoading] = useState(true);
  const [needsVault, setNeedsVault] = useState(false);
  const [vaultHandle, setVaultHandle] = useState<any>(null);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

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
      
      const [modulesData, configData] = await Promise.all([
        scanModules(vHandle),
        readJsonFile(vHandle, 'dashboard.json', { categories: {}, defaultCategory: 'Uncategorized' })
      ]);
      setModules(modulesData);
      setConfig(configData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectVault = async () => {
    const handle = await getVaultHandle(true);
    if (handle) {
      loadData(handle);
    }
  };

  const saveConfig = async (newConfig: DashboardConfig) => {
    if (!vaultHandle) return;
    try {
      await writeJsonFile(vaultHandle, 'dashboard.json', newConfig);
    } catch (e) {
      console.error("Failed to save config", e);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed || trimmed === 'Uncategorized') {
      setIsCreatingCategory(false);
      return;
    }
    
    const newConfig = {
      ...config,
      categories: {
        ...config.categories,
        [trimmed]: []
      }
    };
    
    setConfig(newConfig);
    setNewCategoryName("");
    setIsCreatingCategory(false);
    await saveConfig(newConfig);
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Delete category "${catName}"? Modules inside will be moved to Uncategorized.`)) return;
    
    const updatedCategories = { ...config.categories };
    delete updatedCategories[catName];
    
    const newConfig = {
      ...config,
      categories: updatedCategories
    };
    
    setConfig(newConfig);
    await saveConfig(newConfig);
  };

  const handleRenameCategory = async (oldName: string) => {
    const trimmed = editCategoryName.trim();
    if (!trimmed || trimmed === oldName || trimmed === 'Uncategorized') {
      setEditingCategory(null);
      return;
    }
    
    if (config.categories[trimmed]) {
      alert("A category with this name already exists.");
      return;
    }

    const updatedCategories = { ...config.categories };
    updatedCategories[trimmed] = updatedCategories[oldName] || [];
    delete updatedCategories[oldName];

    const newConfig = {
      ...config,
      categories: updatedCategories
    };

    setConfig(newConfig);
    setEditingCategory(null);
    await saveConfig(newConfig);
  };

  const handleMoveModule = async (moduleName: string, targetCategory: string) => {
    const updatedCategories = { ...config.categories };
    
    // Remove module name from any category it's currently listed under
    Object.keys(updatedCategories).forEach(cat => {
      updatedCategories[cat] = updatedCategories[cat].filter(m => m !== moduleName);
    });
    
    // Add to target category if it's not the fallback "Uncategorized"
    if (targetCategory !== 'Uncategorized') {
      if (!updatedCategories[targetCategory]) {
        updatedCategories[targetCategory] = [];
      }
      updatedCategories[targetCategory].push(moduleName);
    }
    
    const newConfig = {
      ...config,
      categories: updatedCategories
    };
    
    setConfig(newConfig);
    await saveConfig(newConfig);
  };

  // Helper to extract code inside brackets/parentheses for sorting
  const getSortKey = (name: string) => {
    const match = name.match(/\(([^)]+)\)/);
    if (match) return match[1].trim().toLowerCase();
    return name.trim().toLowerCase();
  };

  // Grouping logic (Categories sorted alphabetically)
  const categoryKeys = Object.keys(config.categories).sort((a, b) => a.localeCompare(b));
  const grouped: Record<string, ModuleData[]> = {};
  categoryKeys.forEach(cat => {
    grouped[cat] = [];
  });
  grouped['Uncategorized'] = [];

  modules.forEach(mod => {
    let found = false;
    for (const cat of categoryKeys) {
      if (config.categories[cat]?.includes(mod.name)) {
        grouped[cat].push(mod);
        found = true;
        break;
      }
    }
    if (!found) {
      grouped['Uncategorized'].push(mod);
    }
  });

  // Sort modules in each category alphabetically based on the bracket code
  Object.keys(grouped).forEach(cat => {
    grouped[cat].sort((a, b) => {
      const codeA = getSortKey(a.name);
      const codeB = getSortKey(b.name);
      const comp = codeA.localeCompare(codeB);
      if (comp !== 0) return comp;
      return a.name.localeCompare(b.name);
    });
  });

  // Filter which categories to render
  const categoriesToRender = [
    ...categoryKeys.map(name => ({ name, isDefault: false })),
  ];
  if (grouped['Uncategorized'].length > 0) {
    categoriesToRender.push({ name: 'Uncategorized', isDefault: true });
  }

  const allCategoriesList = [...categoryKeys, 'Uncategorized'];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden relative">
      
      {needsVault && (
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
      )}

      {/* SIDEBAR */}
      <aside className="w-[320px] flex flex-col bg-background border-r border-border z-10 shrink-0">
        <div className="h-32 relative border-b border-border flex flex-col items-start justify-center p-6 overflow-hidden">
          <div className="absolute right-4 top-4 w-2 h-2 bg-primary rounded-full"></div>
          <div className="font-semibold tracking-wide">Student Dashboard</div>
          <div className="text-xs text-muted-foreground mt-1">Local-First System</div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/">
            <NavItem icon={<BookOpen size={18} />} label="Syllabus Map (IA ↔ Y2)" active />
          </Link>
          <Link href="/internships">
            <NavItem icon={<Briefcase size={18} />} label="Internship & Job Hub" />
          </Link>
          <Link href="/calendar">
            <NavItem icon={<Calendar size={18} />} label="University Calendar" />
          </Link>
        </nav>
        <CalendarWidget />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER */}
        <header className="px-8 pt-10 pb-6 flex justify-between items-end border-b border-border/50">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">Syllabus Map</h1>
            <p className="text-sm text-muted-foreground mt-2">Manage and categorize your local Obsidian academic vault.</p>
          </div>
          <div className="flex items-center gap-4">
            {isCreatingCategory ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  placeholder="Category Name" 
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                  className="w-48 h-9 bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button size="sm" onClick={handleCreateCategory} className="bg-blue-600 hover:bg-blue-700 text-white px-2 h-9">
                  <Check size={16} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCreatingCategory(false)} className="border-border text-foreground hover:bg-secondary px-2 h-9">
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsCreatingCategory(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs px-3">
                <Plus size={14} className="mr-1.5" /> Create Category
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* CATEGORY LIST SECTION */}
        <section className="p-8 flex-1 flex flex-col gap-10">
          {isLoading ? (
            <div className="text-sm text-muted-foreground animate-pulse">Scanning local disk for modules...</div>
          ) : categoriesToRender.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No modules found. Ensure your Obsidian vault matches the scanned structure.</div>
          ) : (
            categoriesToRender.map(category => {
              const catModules = grouped[category.name] || [];
              
              return (
                <div key={category.name} className="w-full flex flex-col">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {editingCategory === category.name ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameCategory(category.name)}
                            className="h-8 w-48 text-sm bg-background border-border"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleRenameCategory(category.name)}
                            className="text-green-500 hover:text-green-400 p-1 rounded hover:bg-secondary/50 cursor-pointer"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingCategory(null)}
                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-secondary/50 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-lg font-medium text-foreground whitespace-nowrap tracking-wide">{category.name}</h2>
                          {!category.isDefault && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setEditingCategory(category.name);
                                  setEditCategoryName(category.name);
                                }}
                                className="text-muted-foreground hover:text-blue-400 p-1 rounded hover:bg-secondary/50 transition-colors cursor-pointer"
                                title="Rename Category"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(category.name)}
                                className="text-muted-foreground hover:text-red-400 p-1 rounded hover:bg-secondary/50 transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-border/80 ml-4"></div>
                  </div>
                  
                  {/* Module Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {catModules.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 italic opacity-60 col-span-full">No modules in this category.</div>
                    ) : (
                      catModules.map((mod, idx) => (
                        <ModuleCard 
                          key={idx} 
                          moduleData={mod} 
                          categoriesList={allCategoriesList} 
                          currentCategory={category.name} 
                          onMove={handleMoveModule} 
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>
    </div>
  );
}

/* --- Subcomponents --- */

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

interface ModuleCardProps {
  moduleData: ModuleData;
  categoriesList: string[];
  currentCategory: string;
  onMove: (moduleName: string, targetCategory: string) => void;
}

function ModuleCard({ moduleData, categoriesList, currentCategory, onMove }: ModuleCardProps) {
  // Aggregate total files across all directories for this module
  const totalFiles = 
    (moduleData.resources.lectureNotes?.length || 0) +
    (moduleData.resources.problemSheets?.length || 0) +
    (moduleData.resources.pastPapers?.length || 0) +
    (moduleData.resources.textbooks?.length || 0);
    
  return (
    <div className="relative group">
      <Link href={`/modules/${encodeURIComponent(moduleData.name)}`} className="block h-full">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between transition-all duration-200 cursor-pointer hover:border-primary/45 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)] hover:bg-accent h-full pr-12">
          <div className="flex items-center gap-3 min-w-0">
            <Book size={18} className="text-muted-foreground shrink-0" />
            <span className="text-base font-medium text-foreground truncate">{moduleData.name}</span>
          </div>
          {totalFiles > 0 && (
            <span className="text-xs bg-secondary text-secondary-foreground border border-border/50 px-2 py-1 rounded-md shrink-0 ml-2">
              {totalFiles} file{totalFiles === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </Link>

      {/* Move Module Menu Button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            title="Move Category"
          >
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-popover-foreground">
            <DropdownMenuLabel>Move to...</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {categoriesList
              .filter(cat => cat !== currentCategory)
              .map(cat => (
                <DropdownMenuItem 
                  key={cat}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onMove(moduleData.name, cat);
                  }}
                  className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  {cat}
                </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}