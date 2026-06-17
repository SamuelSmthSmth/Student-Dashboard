import React from 'react';
import { 
  BookOpen, 
  FolderOpen, 
  Code, 
  Briefcase, 
  Settings, 
  Plus, 
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardTemplate() {
  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[260px] flex flex-col bg-background border-r border-border z-10">
        {/* Brand / Logo Area */}
        <div className="h-32 relative border-b border-border flex flex-col items-start justify-center p-6 overflow-hidden">
          <div className="absolute right-4 top-4 w-2 h-2 bg-primary rounded-full"></div>
          <div className="font-semibold tracking-wide">Student Dashboard</div>
          <div className="text-xs text-muted-foreground mt-1">Local-First System</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<BookOpen size={18} />} label="Syllabus Map (IA ↔ Y2)" active />
          <NavItem icon={<FolderOpen size={18} />} label="Problem Repository" />
          <NavItem icon={<Code size={18} />} label="Julia/Python Lab" />
          <NavItem icon={<Briefcase size={18} />} label="Internship & Job Hub" />
        </nav>

        {/* Sidebar Bottom Stats */}
        <div className="p-4 space-y-4 border-t border-border">
          <div className="bg-background border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Current Lock-In Streak</p>
            <p className="text-2xl font-bold text-foreground mt-1">12 days</p>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Total Proofs Conquered</p>
            <p className="text-2xl font-bold text-foreground mt-1">57</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Header */}
        <header className="px-8 pt-10 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">Weekly Planner</h1>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </header>

        {/* Kanban Board Section */}
        <section className="px-8 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Weekly Kanban Board</h2>
            <div className="flex gap-2 text-sm">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md border border-border transition">
                <Settings size={14} /> Config
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md border border-border transition">
                Resources <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="flex gap-6 overflow-x-auto pb-4">
            {/* Column 1 */}
            <KanbanColumn title="QUEUED MODULES (IA/IB)">
              <KanbanCard 
                type="PDF" typeColor="text-destructive bg-destructive/10 border-destructive/20"
                title="Cambridge IA Analysis I: ε-δ Sheet 2"
                progress={45} intensity={13}
              />
              <KanbanCard 
                type="lecture note" typeColor="text-primary bg-primary/10 border-primary/20"
                title="Vectors & Matrices: Linear Maps Problem Set 1"
                progress={20} intensity={10}
              />
            </KanbanColumn>

            {/* Column 2 */}
            <KanbanColumn title="ACTIVE GRIND (80%)">
              <KanbanCard 
                type="PDF" typeColor="text-destructive bg-destructive/10 border-destructive/20"
                title="Cambridge IA Analysis I: ε-δ Sheet 2"
                progress={45} intensity={13}
                details="3/8 proofs verified"
                activeGlow
              />
              <KanbanCard 
                type="PDF" typeColor="text-destructive bg-destructive/10 border-destructive/20"
                title="Vectors & Matrices: Linear Maps Problem Set 1"
                progress={20} intensity={10}
                details="2/10 problems done"
              />
            </KanbanColumn>

            {/* Column 3 */}
            <KanbanColumn title="SNEAK PEEKS (20%)">
              <KanbanCard 
                type="PDF" typeColor="text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
                title="MTH2015: Math of ML - Optimisation Concepts"
                progress={15} intensity={13}
              />
            </KanbanColumn>

            {/* Column 4 */}
            <KanbanColumn title="MASTERED/COMPLETED">
               <KanbanCard 
                type="PDF" typeColor="text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
                title="MTH2015: Math of ML - Optimisation Concepts"
                progress={100} intensity={13}
              />
            </KanbanColumn>
          </div>
        </section>

        {/* Bottom Widgets Row */}
        <section className="p-8 grid grid-cols-3 gap-6">
          
          {/* Circular Timer Widget */}
          <div className="bg-background border border-border rounded-xl p-5 flex flex-col items-center justify-center relative">
            <h3 className="absolute top-4 left-5 text-sm font-medium text-foreground">Time-Boxed Struggle:</h3>
            <div className="relative mt-6 flex items-center justify-center w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-secondary" />
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset="60" className="text-primary" />
              </svg>
              <span className="absolute text-3xl font-light text-foreground">90m</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">(Analysis Sheet 2)</p>
          </div>

          {/* Timers & Prompts Widget */}
          <div className="flex flex-col gap-4">
            <div className="bg-background border border-border rounded-xl p-4">
               <div className="flex justify-between items-end mb-2">
                 <h3 className="text-sm font-medium text-foreground">Time-Boxed Timer:</h3>
                 <span className="text-xs text-muted-foreground">15%</span>
               </div>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-lg text-foreground">90m</span>
                  <span className="text-xs text-muted-foreground">(Analysis Sheet 2)</span>
               </div>
               <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                 <div className="bg-primary h-full w-[15%]"></div>
               </div>
            </div>
            
            <div className="bg-background border border-border rounded-xl p-4 flex-1">
               <h3 className="text-sm font-medium text-foreground mb-2">Daily Feynman Prompt</h3>
               <textarea 
                  className="w-full h-20 bg-background border border-input rounded-md p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                  placeholder="Enter daily Feynman Prompt..."
               />
            </div>
          </div>

          {/* Graph Widget */}
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-foreground">Performance Graph</h3>
            </div>
            {/* SVG Graph Simulation */}
            <div className="w-full h-36 relative border-l border-b border-border pt-2 pr-2">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 {/* Grid lines */}
                 <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" className="text-border" strokeWidth="0.5" />
                 <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-border" strokeWidth="0.5" />
                 <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" className="text-border" strokeWidth="0.5" />
                 
                 {/* Goal Line (Straight) */}
                 <polyline points="0,90 25,65 50,45 75,30 100,20" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" />
                 <circle cx="25" cy="65" r="1.5" fill="currentColor" className="text-muted-foreground" />
                 <circle cx="50" cy="45" r="1.5" fill="currentColor" className="text-muted-foreground" />
                 <circle cx="75" cy="30" r="1.5" fill="currentColor" className="text-muted-foreground" />
                 <circle cx="100" cy="20" r="1.5" fill="currentColor" className="text-muted-foreground" />

                 {/* Actual Line (Curved/Blue) */}
                 <polyline points="0,100 25,85 50,60 75,20 100,10" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" />
                 <circle cx="25" cy="85" r="2" fill="currentColor" className="text-primary" />
                 <circle cx="50" cy="60" r="2" fill="currentColor" className="text-primary" />
                 <circle cx="75" cy="20" r="2" fill="currentColor" className="text-primary" />
                 <circle cx="100" cy="10" r="2" fill="currentColor" className="text-primary" />
              </svg>
              {/* Legend */}
              <div className="absolute top-0 right-0 flex gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-primary"></div> Actual</span>
                <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-muted-foreground"></div> Goal</span>
              </div>
            </div>
          </div>

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

function KanbanColumn({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="min-w-[300px] w-[300px] flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground tracking-wider mb-1">
        <span>{title}</span>
        <div className="flex gap-1 cursor-pointer hover:text-foreground transition-colors">
           <Plus size={14} />
           <MoreVertical size={14} />
        </div>
      </div>
      {children}
    </div>
  );
}

function KanbanCard({ type, typeColor, title, progress, intensity, details, activeGlow = false }: any) {
  return (
    <div className={`bg-background border ${activeGlow ? 'border-primary' : 'border-border'} rounded-lg p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${typeColor}`}>
          📄 {type}
        </span>
      </div>
      <h3 className="text-sm font-medium text-foreground leading-snug">{title}</h3>
      
      {/* Progress Bar Area */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
          <div className="bg-primary h-full" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
           {details ? <span>{details}</span> : <span>Intensity: {intensity}</span>}
           <span>{progress}%{details && ' complete'}</span>
        </div>
      </div>
    </div>
  );
}