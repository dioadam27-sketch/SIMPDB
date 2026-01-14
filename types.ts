
export enum DayOfWeek {
  SENIN = 'Senin',
  SELASA = 'Selasa',
  RABU = 'Rabu',
  KAMIS = 'Kamis',
  JUMAT = 'Jumat',
  SABTU = 'Sabtu'
}

export const TIME_SLOTS = [
  '07:00 - 08:40', 
  '09:00 - 10:40', 
  '11:00 - 12:40', 
  '13:00 - 14:40', 
  '15:00 - 16:40'
];

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
}

export interface Lecturer {
  id: string;
  name: string;
  nip: string;
  position: string;
  expertise: string;
  username?: string;
  password?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  location?: string;
}

export interface ClassName {
  id: string;
  name: string;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  lecturerId: string;
  roomId: string;
  className: string; 
  day: DayOfWeek;
  timeSlot: string;
}

export type UserRole = 'admin' | 'lecturer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type ViewState = 'dashboard' | 'courses' | 'lecturers' | 'rooms' | 'classes' | 'schedule' | 'portal' | 'monitoring' | 'settings';
