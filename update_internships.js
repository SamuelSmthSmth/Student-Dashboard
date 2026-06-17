const fs = require('fs');

let content = fs.readFileSync('src/app/internships/page.tsx', 'utf-8');

// 1. STATUSES array
content = content.replace(
  'const STATUSES = ["All", "Queued", "Applied", "Interviewing", "Offers", "Rejected"];',
  'const STATUSES = ["All", "Queued", "Applied", "Interviewing", "Accepted", "Rejected"];'
);

// 2. newJob state
content = content.replace(
  `  const [newJob, setNewJob] = useState({
    company: "",
    program: "",
    status: "Queued",
    closingDate: ""
  });`,
  `  const [newJob, setNewJob] = useState({
    company: "",
    program: "",
    status: "Queued",
    closingDate: "",
    startDate: "",
    length: ""
  });`
);

// 3. handleCreate
content = content.replace(
  `      status: newJob.status,
      closingDate: newJob.closingDate,
      stage: "",`,
  `      status: newJob.status,
      closingDate: newJob.closingDate,
      startDate: newJob.startDate,
      length: newJob.length,
      stage: "",`
);

content = content.replace(
  `setNewJob({ company: "", program: "", status: "Queued", closingDate: "" });`,
  `setNewJob({ company: "", program: "", status: "Queued", closingDate: "", startDate: "", length: "" });`
);

// 4. Sidebar width and remove stats
content = content.replace(
  '<aside className="w-[260px] flex flex-col bg-background border-r border-border z-10 shrink-0">',
  '<aside className="w-[320px] flex flex-col bg-background border-r border-border z-10 shrink-0">'
);

content = content.replace(
  /<div className="p-4 space-y-4 border-t border-border">[\s\S]*?<\/div>\n\s*<\/aside>/g,
  `</aside>`
);

// 5. Redesign AccordionItem
const accordionItemRegex = /<AccordionItem key=\{job\.id\} value=\{job\.id\} className="border border-border rounded-lg bg-background px-4">[\s\S]*?<\/AccordionItem>/g;

const newAccordionItem = `
                  <AccordionItem key={job.id} value={job.id} className="border border-border rounded-lg bg-background relative overflow-hidden group">
                    {/* Progress bar background indicator */}
                    <div className="absolute bottom-0 left-0 h-1 bg-secondary w-full" />
                    <div 
                      className={\`absolute bottom-0 left-0 h-1 transition-all duration-500 \${
                        job.status === 'Rejected' ? 'bg-red-500/80' : 
                        job.status === 'Accepted' ? 'bg-emerald-500/80' : 
                        'bg-blue-500/80'
                      }\`} 
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
                        <SelectTrigger className="w-[140px] h-9 bg-slate-900 border-slate-700 text-sm focus:ring-0 text-slate-200">
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
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-3">
                          <Building2 size={20} className="text-muted-foreground" />
                          <span className="text-xl font-bold">{job.company}</span>
                          <span className="text-base font-medium text-muted-foreground ml-2">{job.program}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>Close: {job.closingDate || 'TBD'}</span>
                          </div>
                          {job.startDate && (
                             <div className="flex items-center gap-1.5">
                               <Calendar size={14} />
                               <span>Start: {job.startDate}</span>
                             </div>
                          )}
                          {job.length && (
                             <div className="flex items-center gap-1.5">
                               <span className="font-mono text-xs border border-slate-700 bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                 {job.length}
                               </span>
                             </div>
                          )}
                          {job.stage && (
                             <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-secondary/50 border-border px-2 py-0.5 ml-2">
                               {job.stage}
                             </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-2 pb-6 px-5 border-t border-border mt-0">
                       <div className="flex flex-col gap-6 pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Stage</label>
                               <Input 
                                 value={job.stage || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "stage", e.target.value)}
                                 className="bg-background border-border text-sm font-mono focus-visible:ring-1 focus-visible:ring-primary h-9" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closing Date</label>
                               <Input 
                                 type="date"
                                 value={job.closingDate || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "closingDate", e.target.value)}
                                 className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                               <Input 
                                 type="date"
                                 value={job.startDate || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "startDate", e.target.value)}
                                 className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9" 
                               />
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Length</label>
                               <Input 
                                 value={job.length || ""} 
                                 onChange={(e) => handleUpdateJob(job.id, "length", e.target.value)}
                                 placeholder="e.g. 10 weeks"
                                 className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9" 
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
                               className="h-20 resize-none bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary"
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
                  </AccordionItem>`;

content = content.replace(accordionItemRegex, newAccordionItem);

// 6. Update Create Modal to include startDate and length and fix "Offers" -> "Accepted"
const selectItemsRegex = /<SelectItem value="Offers">Offers<\/SelectItem>/g;
content = content.replace(selectItemsRegex, '<SelectItem value="Accepted">Accepted</SelectItem>');

content = content.replace(
  `              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Closing Date</label>
                <Input 
                  type="date"
                  value={newJob.closingDate}
                  onChange={(e) => setNewJob({...newJob, closingDate: e.target.value})}
                  className="bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary h-9"
                />
              </div>
            </div>
          </div>`,
  `              <div className="flex flex-col gap-2">
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
          </div>`
);

fs.writeFileSync('src/app/internships/page.tsx', content);
console.log("Updated src/app/internships/page.tsx");
