"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  FolderOpen, 
  Code, 
  Briefcase,
  ExternalLink,
  Calendar,
  Building2,
  AlignLeft,
  GraduationCap,
  Save,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { getVaultHandle, readJsonFile, writeJsonFile } from '@/lib/fs-helper';
import { ThemeToggle } from '@/components/theme-toggle';
import { CalendarWidget } from '@/components/calendar-widget';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

const STATUSES = ["All", "Queued", "Applied", "Interviewing", "Accepted", "Rejected"];

export default function InternshipsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [vaultHandle, setVaultHandle] = useState<any>(null);
  const [needsVault, setNeedsVault] = useState(false);
  
  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    company: "",
    program: "",
    status: "Queued",
    closingDate: "",
    startDate: "",
    length: ""
  });

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
      
      const jobsData = await readJsonFile(vHandle, 'internships.json', []);
      setJobs(jobsData);
    } catch (err) {
      console.error("Failed to load internships", err);
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

  const handleUpdateJob = (id: string, field: string, value: string) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, [field]: value } : job));
  };

  const handleSave = async (id: string) => {
    if (!vaultHandle) return;
    setSavingId(id);
    try {
      await writeJsonFile(vaultHandle, 'internships.json', jobs);
      // Small artificial delay so the user clearly sees the "Saving..." state
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!vaultHandle || !window.confirm("Are you sure you want to delete this application?")) return;
    
    const updatedJobs = jobs.filter(job => job.id !== id);
    setJobs(updatedJobs);
    
    try {
      await writeJsonFile(vaultHandle, 'internships.json', updatedJobs);
    } catch (err) {
      console.error(err);
      alert("Failed to delete application.");
    }
  };

  const handleCreate = async () => {
    if (!newJob.company || !newJob.program) {
      alert("Company Name and Role / Program are required.");
      return;
    }
    
    setIsCreating(true);
    
    const jobToCreate = {
      id: Date.now().toString(),
      company: newJob.company,
      program: newJob.program,
      status: newJob.status,
      closingDate: newJob.closingDate,
      startDate: newJob.startDate,
      length: newJob.length,
      stage: "",
      notes: "",
      link: ""
    };

    const updatedJobs = [jobToCreate, ...jobs];
    setJobs(updatedJobs);
    
    try {
      await writeJsonFile(vaultHandle, 'internships.json', updatedJobs);
      
      setIsCreateOpen(false);
      setNewJob({ company: "", program: "", status: "Queued", closingDate: "", startDate: "", length: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create new application.");
    } finally {
      setIsCreating(false);
    }
  };

  // Filtering
  let filteredJobs = jobs;
  if (activeTab !== "All") {
    filteredJobs = jobs.filter(j => j.status === activeTab);
  }

  // Sorting
  filteredJobs.sort((a, b) => {
    if (sortOrder === "asc") {
      return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
    } else {
      return new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime();
    }
  });

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
            <NavItem icon={<BookOpen size={18} />} label="Syllabus Map (IA ↔ Y2)" />
          </Link>
          <Link href="/internships">
            <NavItem icon={<Briefcase size={18} />} label="Internship & Job Hub" active />
          </Link>
          <Link href="/calendar">
            <NavItem icon={<Calendar size={18} />} label="University Calendar" />
          </Link>
        </nav>
        <CalendarWidget />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="px-8 pt-10 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">Internship & Job Hub</h1>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </header>

        <section className="px-8 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[600px]">
              <TabsList className="grid w-full grid-cols-6 bg-secondary/50 border border-border">
                {STATUSES.map(status => (
                  <TabsTrigger key={status} value={status} className="text-xs">
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="text-xs text-muted-foreground font-medium">Sort by Closing Date:</span>
                 <Select value={sortOrder} onValueChange={(val) => setSortOrder(val || "asc")}>
                   <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border">
                     <SelectValue placeholder="Sort" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="asc">Earliest First</SelectItem>
                     <SelectItem value="desc">Latest First</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3"
              >
                <Plus size={14} className="mr-1.5" /> Add Application
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-8 pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={20} />
                Loading internships...
              </div>
            ) : filteredJobs.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed border-border rounded-lg gap-4">
                 <p>No internships found.</p>
                 <Button 
                   onClick={() => setIsCreateOpen(true)} 
                   variant="outline" 
                   className="border-border text-foreground hover:bg-secondary"
                 >
                   <Plus size={16} className="mr-2" /> Add your first application
                 </Button>
               </div>
            ) : (
              <Accordion className="w-full space-y-3">
                {filteredJobs.map(job => (
                  
                  <AccordionItem key={job.id} value={job.id} className="border border-border rounded-lg bg-background relative overflow-hidden group">
                    {/* Progress bar background indicator */}
                    <div className="absolute bottom-0 left-0 h-1 bg-secondary w-full" />
                    <div 
                      className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${
                        job.status === 'Rejected' ? 'bg-red-500/80' : 
                        job.status === 'Accepted' ? 'bg-emerald-500/80' : 
                        'bg-blue-500/80'
                      }`} 
                      style={{ 
                        width: job.status === 'Queued' ? '10%' : 
                               job.status === 'Applied' ? '40%' : 
                               job.status === 'Interviewing' ? '70%' : 
                               (job.status === 'Accepted' || job.status === 'Rejected') ? '100%' : '0%' 
                      }} 
                    />

                    {/* Absolute dropdown that sits on top of trigger */}
                    <div className="absolute right-5 top-5 z-10" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={job.status} 
                        onValueChange={(val) => handleUpdateJob(job.id, "status", val)}
                      >
                        <SelectTrigger className="w-[140px] h-9 bg-background border-border text-sm focus:ring-1 focus:ring-ring text-foreground hover:bg-secondary/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Queued">Queued</SelectItem>
                          <SelectItem value="Applied">Applied</SelectItem>
                          <SelectItem value="Interviewing">Interviewing</SelectItem>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <AccordionTrigger className="hover:no-underline p-5 flex flex-col w-full min-h-[120px] justify-start items-start pr-[180px]">
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex flex-col items-start text-left">
                          <div className="flex items-start gap-3">
                            <Building2 size={20} className="text-muted-foreground shrink-0 mt-1" />
                            <span className="text-2xl font-extrabold leading-tight">{job.company}</span>
                          </div>
                          <span className="text-base font-medium text-muted-foreground ml-8">{job.program}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-col gap-1 mt-2 ml-8 text-left">
                          <span>📅 Close: {job.closingDate || 'TBD'}</span>
                          <span>🚀 Starts: {job.startDate || 'N/A'}</span>
                          <span>⏳ Length: {job.length || 'N/A'}</span>
                          <span>🗺 Stage: {job.stage || 'None'}</span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-2 pb-6 px-5 border-t border-border mt-0">
                       <div className="flex flex-col gap-6 pt-4">

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name</label>
                               <Input 
                                 value={job.company || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "company", e.target.value)}
                                 className="bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring h-9 text-foreground w-full" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role Title</label>
                               <Input 
                                 value={job.program || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "program", e.target.value)}
                                 className="bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring h-9 text-foreground w-full" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage</label>
                               <Input 
                                 value={job.stage || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "stage", e.target.value)}
                                 placeholder="e.g. Phone Screen"
                                 className="bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring h-9 text-foreground w-full" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closing Date</label>
                               <Input 
                                 type="date"
                                 value={job.closingDate || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "closingDate", e.target.value)}
                                 className="bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring h-9 text-foreground w-full" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                               <Input 
                                 type="date"
                                 value={job.startDate || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "startDate", e.target.value)}
                                 className="bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring h-9 text-foreground w-full" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Length</label>
                               <Input 
                                 value={job.length || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "length", e.target.value)}
                                 placeholder="e.g. 10 weeks"
                                 className="bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring h-9 text-foreground w-full" 
                               />
                             </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                 <AlignLeft size={14} /> Notes
                               </label>
                             </div>
                             <Textarea 
                               value={job.notes || ""}
                               onChange={(e) => handleUpdateJob(job.id, "notes", e.target.value)}
                               rows={3}
                               className="h-20 resize-none bg-background border border-border text-foreground text-sm focus-visible:ring-1 focus-visible:ring-ring"
                               placeholder="Add interview prep, thoughts, or application links here..."
                             />
                          </div>

                          <div className="flex justify-end gap-3 mt-2">
                             <Button 
                               onClick={() => handleDelete(job.id)}
                               variant="outline" 
                               size="sm" 
                               className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive mr-auto"
                             >
                               <Trash2 size={14} className="mr-2" />
                               Delete
                             </Button>
                             <a href={job.link || "#"} target="_blank" rel="noopener noreferrer">
                               <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                                 <ExternalLink size={14} className="mr-2" />
                                 Open Website
                               </Button>
                             </a>
                             <Button 
                               onClick={() => handleSave(job.id)}
                               disabled={savingId === job.id}
                               size="sm" 
                               className="bg-primary text-primary-foreground hover:bg-primary/90 w-[140px]"
                             >
                               {savingId === job.id ? (
                                 <><Loader2 className="animate-spin mr-2" size={14} /> Saving...</>
                               ) : (
                                 <><Save size={14} className="mr-2" /> Save Changes</>
                               )}
                             </Button>
                          </div>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </section>
      </main>

      {/* CREATE APPLICATION MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Application</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new internship application to your tracker.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</label>
              <Input 
                value={newJob.company}
                onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                placeholder="e.g. Acme Corp"
                className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Role / Program</label>
              <Input 
                value={newJob.program}
                onChange={(e) => setNewJob({...newJob, program: e.target.value})}
                placeholder="e.g. SWE Intern"
                className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Initial Status</label>
                <Select value={newJob.status} onValueChange={(val) => setNewJob({...newJob, status: val || "Queued"})}>
                  <SelectTrigger className="bg-background border-border h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Queued">Queued</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Closing Date</label>
                <Input 
                  type="date"
                  value={newJob.closingDate}
                  onChange={(e) => setNewJob({...newJob, closingDate: e.target.value})}
                  className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</label>
                <Input 
                  type="date"
                  value={newJob.startDate}
                  onChange={(e) => setNewJob({...newJob, startDate: e.target.value})}
                  className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Length</label>
                <Input 
                  value={newJob.length}
                  onChange={(e) => setNewJob({...newJob, length: e.target.value})}
                  placeholder="e.g. 10 weeks"
                  className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsCreateOpen(false)} variant="outline" className="border-border text-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isCreating} 
              className="bg-blue-600 hover:bg-blue-700 text-white w-[100px]"
            >
              {isCreating ? <Loader2 className="animate-spin" size={16} /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
