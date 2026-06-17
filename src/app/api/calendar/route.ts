import { NextResponse } from 'next/server';
import ical from 'node-ical';

const EXETER_URL = "https://mytimetable.exeter.ac.uk/ical?6a32f0a1&group=false&eu=c280NzQ=&h=MKUu-eaUcbW-QfqVwKHubxzwtfMwo1ZgbnILGGVjdZg=";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(EXETER_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`);
    }
    
    const icsData = await response.text();
    const events = ical.sync.parseICS(icsData);

    const processedEvents: any[] = [];

    for (const key in events) {
      const event = (events as any)[key];
      if (event && event.type === 'VEVENT') {
        const start = new Date(event.start);
        const end = new Date(event.end);
        
        processedEvents.push({
          id: event.uid || key,
          title: event.summary,
          start: start.toISOString(),
          end: end.toISOString(),
          location: event.location || 'No location'
        });
      }
    }

    processedEvents.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json(processedEvents);
  } catch (error) {
    console.error('Error in /api/calendar:', error);
    return NextResponse.json([]);
  }
}
