
import { AttendanceJson, AttendanceRecord, EmployeeName, ORDERED_EMPLOYEES } from '../types';

/**
 * Normalizes time string to 24-hour HH:MM format
 */
function normalizeTime(timeStr: string): string {
  if (!timeStr) return 'L';
  // Matches "HH : MM am/pm" or "HH:MM am/pm"
  const regex = /(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?/i;
  const match = timeStr.match(regex);
  if (!match) return 'L';

  let [_, hours, minutes, period] = match;
  let h = parseInt(hours, 10);
  const m = minutes.padStart(2, '0');

  if (period) {
    const p = period.toLowerCase();
    if (p === 'pm' && h < 12) h += 12;
    if (p === 'am' && h === 12) h = 0;
  }

  return `${h.toString().padStart(2, '0')}:${m}`;
}

/**
 * Maps a name to the normalized employee list
 */
function findEmployee(text: any): EmployeeName | null {
  if (!text || typeof text !== 'string') return null;
  
  const normalizedText = text.toLowerCase();
  for (const employee of ORDERED_EMPLOYEES) {
    if (normalizedText.includes(employee.toLowerCase())) {
      return employee;
    }
  }
  return null;
}

/**
 * Sorts dates in DD/MM/YYYY format
 */
function sortDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => {
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    const dateA = new Date(ya, ma - 1, da);
    const dateB = new Date(yb, mb - 1, db);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Main parser logic
 */
export function transformAttendanceData(jsonData: AttendanceJson): string {
  const recordsByDate: Record<string, Record<string, string>> = {};

  if (!jsonData || !jsonData.messages) return '';

  jsonData.messages.forEach(msg => {
    // Extract text content reliably (handles strings or Telegram-style arrays)
    let textContent = '';
    if (typeof msg.text === 'string') {
      textContent = msg.text;
    } else if (Array.isArray(msg.text)) {
      // Fix: msg.text is no longer 'never' here because ChatMessage.text allows any[] in types.ts
      textContent = msg.text.map(part => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) return String(part.text);
        return '';
      }).join('');
    }

    if (!textContent) return;

    // Look for Date DD/MM/YYYY
    const dateMatch = textContent.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) return;

    const date = dateMatch[0];
    
    // Check 'from' field and 'text' content for employee name
    const employee = findEmployee(textContent) || findEmployee(msg.from);
    if (!employee) return;

    // Split text to find potentially multiple times, take the first one
    // Regex matches patterns like 09:30 am, 09:30am, 09 :30 am
    const timeMatches = textContent.match(/(\d{1,2})\s*:\s*(\d{2})\s*(?:am|pm)?/gi);
    if (!timeMatches) return;

    const time = normalizeTime(timeMatches[0]);

    if (!recordsByDate[date]) {
      recordsByDate[date] = {};
    }

    // Earliest check-in per employee per date
    if (!recordsByDate[date][employee] || time < recordsByDate[date][employee]) {
      recordsByDate[date][employee] = time;
    }
  });

  const sortedDates = sortDates(Object.keys(recordsByDate));
  
  if (sortedDates.length === 0) return 'No valid attendance records found.';

  // Build CSV
  const header = ['Date', ...ORDERED_EMPLOYEES].join(',');
  const rows = sortedDates.map(date => {
    const dateData = recordsByDate[date];
    const employeeTimes = ORDERED_EMPLOYEES.map(emp => dateData[emp] || 'L');
    return [date, ...employeeTimes].join(',');
  });

  return [header, ...rows].join('\n');
}
