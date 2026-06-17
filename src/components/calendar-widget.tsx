"use client";

import React, { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch('/api/calendar');
        if (res.ok) {
          const data = await res.json();
          const now = new Date();
          const todayEvents = data.filter((e: CalendarEvent) => {
            const eventDate = new Date(e.start);
            return (
              eventDate.getDate() === now.getDate() &&
              eventDate.getMonth() === now.getMonth() &&
              eventDate.getFullYear() === now.getFullYear()
            );
          });
          setEvents(todayEvents);
        }
      } catch (err) {
        console.error("Failed to load calendar", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCalendar();
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
          <div className="text-xs text-muted-foreground italic">No classes today.</div>
        ) : (
          events.map(event => {
            const startDate = new Date(event.start);
            const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={event.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">{timeString}</span>
                  <span className="text-xs text-muted-foreground truncate" title={event.title}>{event.title}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
