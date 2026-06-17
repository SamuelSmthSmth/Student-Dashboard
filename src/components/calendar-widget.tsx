"use client";

import React, { useState, useEffect } from 'react';

import { Calendar as CalendarIcon, Briefcase, Rocket, AlertCircle } from 'lucide-react';
import { getVaultHandle, readJsonFile } from '@/lib/fs-helper';

interface UnifiedEvent {
  id: string;
  title: string;
  date: Date;
  type: 'lecture' | 'deadline' | 'start';
  meta?: string;
}

export function CalendarWidget() {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllEvents() {
      try {
        const unified: UnifiedEvent[] = [];
        
        // 1. Fetch Calendar Lectures
        const res = await fetch('/api/calendar');
        if (res.ok) {
          const calendarData = await res.json();
          calendarData.forEach((e: any) => {
            unified.push({
              id: `cal-${e.id}`,
              title: e.title,
              date: new Date(e.start),
              type: 'lecture',
              meta: e.location
            });
          });
        }

        // 2. Fetch Internships
        const handle = await getVaultHandle(false);
        if (handle) {
          const jobsData = await readJsonFile(handle, 'internships.json', []);
          jobsData.forEach((job: any) => {
            if (job.closingDate) {
              const d = new Date(job.closingDate);
              if (!isNaN(d.getTime())) {
                unified.push({
                  id: `deadline-${job.id}`,
                  title: `Deadline: ${job.program}`,
                  date: d,
                  type: 'deadline',
                  meta: job.company
                });
              }
            }
            if (job.startDate) {
              const d = new Date(job.startDate);
              if (!isNaN(d.getTime())) {
                unified.push({
                  id: `start-${job.id}`,
                  title: `Starts: ${job.program}`,
                  date: d,
                  type: 'start',
                  meta: job.company
                });
              }
            }
          });
        }

        // Combine & Sort
        unified.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Filter for Today
        const now = new Date();
        const todayEvents = unified.filter(e => {
          return (
            e.date.getDate() === now.getDate() &&
            e.date.getMonth() === now.getMonth() &&
            e.date.getFullYear() === now.getFullYear()
          );
        });
        
        setEvents(todayEvents);
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllEvents();
  }, []);

  return (
    <div className="px-4 pb-6 mt-auto">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        Today's Agenda
      </div>
      <div className="space-y-3 px-1">
        {isLoading ? (
          <div className="text-xs text-muted-foreground animate-pulse">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">No events today.</div>
        ) : (
          events.map(event => {
            const timeString = event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let icon = <CalendarIcon size={14} className="text-blue-500 mt-0.5" />;
            let titleClass = "text-foreground";
            
            if (event.type === 'deadline') {
              icon = <AlertCircle size={14} className="text-red-500 mt-0.5" />;
              titleClass = "text-red-500 font-bold";
            } else if (event.type === 'start') {
              icon = <Rocket size={14} className="text-emerald-500 mt-0.5" />;
              titleClass = "text-emerald-500 font-bold";
            }

            return (
              <div key={event.id} className="flex items-start gap-2">
                <div className="shrink-0">{icon}</div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold whitespace-nowrap ${titleClass}`}>
                    {event.type === 'lecture' ? timeString : event.title}
                  </span>
                  <span className="text-xs text-muted-foreground truncate" title={event.type === 'lecture' ? event.title : event.meta}>
                    {event.type === 'lecture' ? event.title : event.meta}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
