"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, FolderOpen, Code, Briefcase, Plus, GripVertical, ChevronRight, Check, X, Book 
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ModuleData {
  name: string;
  resources: {
    lectureNotes: string[];
    problemSheets: string[];
    pastPapers: string[];
    textbooks: string[];
  };
}

interface Category {
  id: string;
  name: string;
}

export default function DashboardTemplate() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock Categories State
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Cambridge Year 1' },
    { id: '2', name: 'Exeter Year 2' },
  ]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    async function fetchModules() {
      try {
        const res = await fetch('/api/modules');
        const json = await res.json();
        setModules(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModules();
  }, []);

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      setIsCreatingCategory(false);
      return;
    }
    setCategories([...categories, { id: Date.now().toString(), name: newCategoryName }]);
    setNewCategoryName("");
    setIsCreatingCategory(false);
  };

  // Mock Clustering Logic for visual representation
  // We arbitrarily split fetched modules into the first two categories.
  const getModulesForCategory = (catId: string) => {
    if (catId === '1') return modules.filter((_, i) => i % 2 === 0);
    if (catId === '2') return modules.filter((_, i) => i % 2 !== 0);
    return []; // newly created categories are empty for now
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[260px] flex flex-col bg-background border-r border-border z-10 shrink-0">
        <div className="h-32 relative border-b border-border flex flex-col items-start justify-center p-6 overflow-hidden">
          <div className="absolute right-4 top-4 w-2 h-2 bg-primary rounded-full"></div>
          <div className="font-semibold tracking-wide">Student Dashboard</div>
          <div className="text-xs text-muted-foreground mt-1">Local-First System</div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/">
            <NavItem icon={<BookOpen size={18} />} label="Syllabus Map (IA ↔ Y2)" active />
          </Link>
          <NavItem icon={<FolderOpen size={18} />} label="Problem Repository" />
          <NavItem icon={<Code size={18} />} label="Julia/Python Lab" />
          <Link href="/internships">
            <NavItem icon={<Briefcase size={18} />} label="Internship & Job Hub" />
          </Link>
        </nav>

        <div className="p-4 space-y-4 border-t border-border">
          <div className="bg-background border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Current Lock-In Streak</p>
            <p className="text-2xl font-bold text-foreground mt-1">12 days</p>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Total Modules Synced</p>
            <p className="text-2xl font-bold text-foreground mt-1">{modules.length}</p>
          </div>
        </div>
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
          ) : (
            categories.map(category => {
              const catModules = getModulesForCategory(category.id);
              
              return (
                <div key={category.id} className="w-full flex flex-col">
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-lg font-medium text-foreground whitespace-nowrap tracking-wide">{category.name}</h2>
                    <div className="h-px w-full bg-border/80"></div>
                  </div>
                  
                  {/* Module Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {catModules.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 italic opacity-60">No modules in this category.</div>
                    ) : (
                      catModules.map((mod, idx) => (
                        <ModuleCard key={idx} moduleData={mod} />
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

function ModuleCard({ moduleData }: { moduleData: ModuleData }) {
  // Aggregate total files across all directories for this module
  const totalFiles = 
    (moduleData.resources.lectureNotes?.length || 0) +
    (moduleData.resources.problemSheets?.length || 0) +
    (moduleData.resources.pastPapers?.length || 0) +
    (moduleData.resources.textbooks?.length || 0);
    
  // Simple slugification for routing
  const slug = moduleData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <Link href={`/modules/${slug}`} className="block h-full">
      <div className="bg-[#161B26] border border-slate-800/60 rounded-xl p-4 flex items-center justify-between transition-all duration-200 cursor-pointer hover:border-blue-500/40 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)] hover:bg-[#1c2331] h-full">
        <div className="flex items-center gap-3">
          <Book size={18} className="text-muted-foreground" />
          <span className="text-base font-medium text-white">{moduleData.name}</span>
        </div>
        {totalFiles > 0 && (
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md shrink-0 ml-2">
            {totalFiles} file{totalFiles === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </Link>
  );
}