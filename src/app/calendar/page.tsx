"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Briefcase, Calendar as CalendarIcon, Save, Loader2 
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { CalendarWidget } from '@/components/calendar-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
}

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
      <div className={`${active ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default function CalendarPage() {
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Fetch dashboard config to prefill URL
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const config = await res.json();
          if (config.calendarUrl) {
            setUrl(config.calendarUrl);
          }
        }
      } catch (err) {}
    }
    fetchConfig();
  }, []);

  // Fetch events
  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {}
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resConfig = await fetch('/api/dashboard');
      const config = await resConfig.json();
      config.calendarUrl = url;
      
      await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      // reload events
      loadEvents();
    } catch (err) {}
    setIsSaving(false);
  };

  const [view, setView] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter events based on view
  const filteredEvents = events.filter(e => {
    const d = new Date(e.start);
    if (view === 'upcoming') {
      return d >= startOfToday;
    } else if (view === 'past') {
      return d < startOfToday;
    }
    return true; // 'all'
  });

  // Sort events:
  // - 'upcoming' or 'all': chronological (ascending)
  // - 'past': reverse-chronological (descending) so newest past events are at the top
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.start).getTime();
    const timeB = new Date(b.start).getTime();
    if (view === 'past') {
      return timeB - timeA;
    }
    return timeA - timeB;
  });

  // Group events by day
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  sortedEvents.forEach(e => {
    const d = new Date(e.start);
    const dateStr = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
    groupedEvents[dateStr].push(e);
  });

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
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
            <NavItem icon={<Briefcase size={18} />} label="Internship & Job Hub" />
          </Link>
          <Link href="/calendar">
            <NavItem icon={<CalendarIcon size={18} />} label="University Calendar" active />
          </Link>
        </nav>
        <CalendarWidget />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="px-8 pt-10 pb-6 flex justify-between items-end border-b border-border/50">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">University Calendar</h1>
            <p className="text-sm text-muted-foreground mt-2">Sync and view your university iCal feed.</p>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </header>

        <div className="p-8 max-w-5xl">
          {/* Settings Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold mb-1 text-foreground">Calendar URL Feed (.ics)</h2>
              <p className="text-xs text-muted-foreground">Paste your university timetable or iCal subscription URL here to sync.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://calendar.university.edu/feed.ics" 
                className="bg-background border-border text-sm flex-1"
              />
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
                {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save URL
              </Button>
            </div>
          </div>

          {/* View Filter Tabs */}
          {!isLoadingEvents && events.length > 0 && (
            <div className="flex gap-2 border-b border-border mb-6">
              <button
                onClick={() => setView('upcoming')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px] ${
                  view === 'upcoming'
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Upcoming ({events.filter(e => new Date(e.start) >= startOfToday).length})
              </button>
              <button
                onClick={() => setView('past')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px] ${
                  view === 'past'
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Past ({events.filter(e => new Date(e.start) < startOfToday).length})
              </button>
              <button
                onClick={() => setView('all')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px] ${
                  view === 'all'
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({events.length})
              </button>
            </div>
          )}

          {/* Events View */}
          <div className="space-y-8">
            {isLoadingEvents ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-xl bg-card/30">
                <CalendarIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-1">No Events Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">There are no classes scheduled, or your URL has not been configured.</p>
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-xl bg-card/30">
                <CalendarIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {view === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {view === 'upcoming' 
                    ? "There are no upcoming classes scheduled. Check the Past or All tabs to see past events."
                    : "There are no past classes recorded in your timetable feed."
                  }
                </p>
              </div>
            ) : (
              Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
                <div key={dateStr} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">{dateStr}</h3>
                  <div className="space-y-3">
                    {dayEvents.map(event => {
                      const startDate = new Date(event.start);
                      const endDate = new Date(event.end);
                      const timeStr = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      const isPast = startDate < startOfToday;
                      
                      return (
                        <div 
                          key={event.id} 
                          className={`bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-primary/40 transition-colors ${
                            isPast ? 'opacity-65' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 md:w-48 shrink-0 text-muted-foreground font-mono text-sm">
                            <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-muted-foreground/45' : 'bg-primary'}`} />
                            {timeStr}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className={`font-semibold text-base truncate ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {event.title}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground md:text-right shrink-0">
                            {event.location}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
