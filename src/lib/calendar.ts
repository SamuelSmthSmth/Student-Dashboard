export function parseBasicICS(icsString: string) {
  const events: any[] = [];
  const lines = icsString.split(/\r\n|\n|\r/);
  
  // Unfold lines (lines starting with space/tab are continuations)
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfoldedLines.length > 0) {
        unfoldedLines[unfoldedLines.length - 1] += line.substring(1);
      }
    } else {
      unfoldedLines.push(line);
    }
  }

  let inEvent = false;
  let currentEvent: any = {};
  
  const parseICSDate = (dateStr: string) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const min = dateStr.substring(11, 13);
    const sec = dateStr.substring(13, 15);
    const isUTC = dateStr.endsWith('Z');
    // Exeter uses Europe/London, appending +00:00 will treat it as GMT roughly.
    return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}${isUTC ? 'Z' : '+00:00'}`);
  };

  for (const line of unfoldedLines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.start) {
        events.push({
          id: currentEvent.uid || Math.random().toString(36).substring(2, 9),
          title: currentEvent.summary || 'Untitled',
          start: currentEvent.start.toISOString(),
          end: (currentEvent.end || currentEvent.start).toISOString(),
          location: currentEvent.location || 'No location'
        });
      }
    } else if (inEvent) {
      if (line.startsWith('UID:')) currentEvent.uid = line.substring(4);
      else if (line.startsWith('SUMMARY:')) currentEvent.summary = line.substring(8);
      else if (line.startsWith('LOCATION:')) currentEvent.location = line.substring(9);
      else if (line.startsWith('DTSTART')) {
        const val = line.split(':')[1];
        if (val) currentEvent.start = parseICSDate(val);
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':')[1];
        if (val) currentEvent.end = parseICSDate(val);
      }
    }
  }
  return events;
}
