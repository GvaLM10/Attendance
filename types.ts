
export interface ChatMessage {
  id: number;
  date: string;
  from: string;
  // Fix: Updated text type to include any[] to support Telegram JSON export formats where text can be an array.
  // This prevents TypeScript from narrowing msg.text to 'never' inside Array.isArray() checks.
  text: string | any[];
}

export interface AttendanceJson {
  name: string;
  messages: ChatMessage[];
}

export interface AttendanceRecord {
  date: string; // DD/MM/YYYY
  employee: string;
  time: string; // HH:MM (24h)
}

export type EmployeeName = 
  | 'Gopalan'
  | 'Navin'
  | 'Jeeva'
  | 'Sandhiya sivakumar'
  | 'Sakthivel'
  | 'Salini'
  | 'Anushree';

export const ORDERED_EMPLOYEES: EmployeeName[] = [
  'Gopalan',
  'Navin',
  'Jeeva',
  'Sandhiya sivakumar',
  'Sakthivel',
  'Salini',
  'Anushree'
];
