"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pin, FileText, ChevronDown, ChevronRight, File, Image as ImageIcon } from 'lucide-react';

// Re-defining interface locally since route imports are tricky with client components
interface ModuleData {
  name: string;
  resources: {
    lectureNotes: string[];
    problemSheets: string[];
    pastPapers: string[];
    textbooks: string[];
  };
}

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function ModuleSplitView({ params }: { params: { slug: string } }) {
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Accordion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    lectureNotes: true,
    problemSheets: true,
    pastPapers: false,
    textbooks: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    async function fetchModule() {
      try {
        const res = await fetch('/api/modules');
        const json = await res.json();
        const modules: ModuleData[] = json.data || [];
        
        // Find the matching module from our local api
        const found = modules.find(m => slugify(m.name) === params.slug);
        if (found) {
          setModuleData(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModule();
  }, [params.slug]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#0D1117] text-white">Loading workspace...</div>;
  }

  if (!moduleData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0D1117] text-white">
        <h1 className="text-2xl font-bold mb-4">Module not found</h1>
        <Link href="/" className="text-blue-500 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const renderResourceList = (title: string, key: keyof ModuleData['resources']) => {
    const files = moduleData.resources[key];
    if (!files || files.length === 0) return null;
    const isExpanded = expandedSections[key];

    return (
      <div className="mb-4">
        <button 
          onClick={() => toggleSection(key)}
          className="flex items-center justify-between w-full text-left font-medium text-slate-300 hover:text-white transition-colors py-2"
        >
          <span>{title} <span className="text-xs text-slate-500 ml-2">({files.length})</span></span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isExpanded && (
          <div className="flex flex-col gap-1 mt-2">
            {files.map((file, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveFile(file)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                  activeFile === file 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                    : 'text-slate-400 hover:bg-[#1c2331] hover:text-slate-200 border border-transparent'
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D1117] font-sans">
      
      {/* LEFT NAVIGATION PANEL (40%) */}
      <div className="w-[40%] flex flex-col border-r border-slate-800/60 bg-[#0D1117] z-10 shrink-0">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/60 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="relative">
            <h1 className="text-2xl font-bold text-white tracking-tight">{moduleData.name}</h1>
            <div className="absolute -bottom-3 left-0 w-12 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Pinboard */}
          <div className="bg-[#161B26] border border-slate-800/60 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-amber-500 font-medium mb-2 text-sm">
              <Pin size={14} /> 📌 Pinboard
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drop quick notes, exam dates, or highly important formulas for {moduleData.name} here.
            </p>
          </div>

          {/* Resources Accordions */}
          <div>
            {renderResourceList('Lecture Notes', 'lectureNotes')}
            {renderResourceList('Problem Sheets', 'problemSheets')}
            {renderResourceList('Past Papers', 'pastPapers')}
            {renderResourceList('Textbooks', 'textbooks')}
          </div>
        </div>
      </div>

      {/* RIGHT PREVIEWER PANEL (60%) */}
      <div className="w-[60%] bg-[#11151E] flex flex-col relative">
        {activeFile ? (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex items-center justify-between mb-4 shrink-0">
               <h2 className="text-lg font-medium text-white flex items-center gap-2">
                 <File size={18} className="text-blue-400" />
                 {activeFile}
               </h2>
               <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md transition-colors border border-slate-700">
                 Open Externally
               </button>
            </div>
            {/* Simulated Viewer Frame */}
            <div className="flex-1 bg-[#1a202c] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative flex items-center justify-center">
               <div className="text-slate-400 flex flex-col items-center">
                 <ImageIcon size={48} className="mb-4 opacity-20 text-slate-300" />
                 <p className="text-lg font-medium text-slate-200">Local Document Viewer</p>
                 <p className="text-sm mt-2 opacity-80">Displaying: {activeFile}</p>
                 <p className="text-xs mt-6 bg-slate-800/50 px-3 py-1.5 rounded text-blue-400 border border-blue-500/20">
                   File protocol integration pending
                 </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-slate-500/80">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-base tracking-wide">Select a document from the left panel to view</p>
          </div>
        )}
      </div>

    </div>
  );
}
