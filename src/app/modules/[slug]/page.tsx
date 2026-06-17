"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pin, FileText, ChevronDown, ChevronRight } from 'lucide-react';

interface ModuleData {
  name: string;
  resources: {
    lectureNotes: string[];
    problemSheets: string[];
    pastPapers: string[];
    textbooks: string[];
  };
}

export default function ModuleSplitView({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // File streaming states
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null);
  const [pinboardContent, setPinboardContent] = useState<string>("Loading pinboard...");

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
        
        // Find the matching module exactly by decoded name
        const decodedName = decodeURIComponent(slug);
        const found = modules.find(m => m.name === decodedName);
        if (found) {
          setModuleData(found);

          // Fetch Pinboard text via the new file API
          try {
            const pinRes = await fetch(`/api/files?module=${encodeURIComponent(found.name)}&category=&file=Pinboard.md`);
            if (pinRes.ok) {
              const pinJson = await pinRes.json();
              setPinboardContent(pinJson.content);
            } else {
              setPinboardContent("No Pinboard.md found in the root of this module. Create one in Obsidian to see notes here.");
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
    }
    fetchModule();
  }, [slug]);

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

  // Click handler that sets up the file streaming URL
  const handleFileClick = (fileName: string, categoryFolder: string) => {
    if (!moduleData) return;
    setActiveFileName(fileName);
    const url = `/api/files?module=${encodeURIComponent(moduleData.name)}&category=${encodeURIComponent(categoryFolder)}&file=${encodeURIComponent(fileName)}`;
    setActiveFileUrl(url);
  };

  const renderResourceList = (title: string, key: keyof ModuleData['resources'], folderName: string) => {
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
                onClick={() => handleFileClick(file, folderName)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                  activeFileName === file 
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                <Pin size={14} /> 📌 Pinboard
              </div>
            </div>
            {/* Raw Text View of Pinboard.md */}
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono bg-[#0D1117]/50 p-3 rounded border border-slate-800/40 max-h-48 overflow-y-auto">
              {pinboardContent}
            </div>
          </div>

          {/* Resources Accordions */}
          <div>
            {renderResourceList('Lecture Notes', 'lectureNotes', 'Lecture Notes')}
            {renderResourceList('Problem Sheets', 'problemSheets', 'Problem Sheets')}
            {renderResourceList('Past Papers', 'pastPapers', 'Past Papers')}
            {renderResourceList('Textbooks', 'textbooks', 'Textbooks')}
          </div>
        </div>
      </div>

      {/* RIGHT PREVIEWER PANEL (60%) */}
      <div className="w-[60%] bg-[#11151E] flex flex-col relative h-full">
        {activeFileUrl ? (
          <iframe 
            src={activeFileUrl} 
            className="w-full h-full border-none bg-white" 
            title={activeFileName || 'Document Viewer'} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-slate-500/80">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-base tracking-wide text-slate-400">Select a document from the left navigation panel to begin studying.</p>
          </div>
        )}
      </div>

    </div>
  );
}
