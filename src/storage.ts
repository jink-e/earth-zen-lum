export type LocationSource = 'default' | 'gps' | 'preset' | 'manual';
export type AppLanguage = 'zh' | 'en';

export interface AppSettings {
  lat: number;
  lon: number;
  locationLabel: string;
  locationSource: LocationSource;
  reminderEnabled: boolean;
  reminderTime: string;
  voiceEnabled: boolean;
  ambientEnabled: boolean;
  reduceMotion: boolean;
  language: AppLanguage;
}

export interface SessionRecord {
  id: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  elapsedSeconds: number;
  completed: boolean;
  mood?: string;
}

export interface LocationPreset {
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  timeZone?: string;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { name: '北京', nameEn: 'Beijing', lat: 39.9042, lon: 116.4074, timeZone: 'Asia/Shanghai' },
  { name: '上海', nameEn: 'Shanghai', lat: 31.2304, lon: 121.4737, timeZone: 'Asia/Shanghai' },
  { name: '广州', nameEn: 'Guangzhou', lat: 23.1291, lon: 113.2644, timeZone: 'Asia/Shanghai' },
  { name: '成都', nameEn: 'Chengdu', lat: 30.5728, lon: 104.0668, timeZone: 'Asia/Shanghai' },
  { name: '香港', nameEn: 'Hong Kong', lat: 22.3193, lon: 114.1694, timeZone: 'Asia/Hong_Kong' },
  { name: '台北', nameEn: 'Taipei', lat: 25.033, lon: 121.5654, timeZone: 'Asia/Taipei' },
  { name: '东京', nameEn: 'Tokyo', lat: 35.6762, lon: 139.6503, timeZone: 'Asia/Tokyo' },
  { name: '首尔', nameEn: 'Seoul', lat: 37.5665, lon: 126.978, timeZone: 'Asia/Seoul' },
  { name: '新加坡', nameEn: 'Singapore', lat: 1.3521, lon: 103.8198, timeZone: 'Asia/Singapore' },
  { name: '悉尼', nameEn: 'Sydney', lat: -33.8688, lon: 151.2093, timeZone: 'Australia/Sydney' },
  { name: '伦敦', nameEn: 'London', lat: 51.5074, lon: -0.1278, timeZone: 'Europe/London' },
  { name: '巴黎', nameEn: 'Paris', lat: 48.8566, lon: 2.3522, timeZone: 'Europe/Paris' },
  { name: '纽约', nameEn: 'New York', lat: 40.7128, lon: -74.006, timeZone: 'America/New_York' },
  { name: '洛杉矶', nameEn: 'Los Angeles', lat: 34.0522, lon: -118.2437, timeZone: 'America/Los_Angeles' },
  { name: '温哥华', nameEn: 'Vancouver', lat: 49.2827, lon: -123.1207, timeZone: 'America/Vancouver' },
  { name: '圣保罗', nameEn: 'Sao Paulo', lat: -23.5505, lon: -46.6333, timeZone: 'America/Sao_Paulo' }
];

const SETTINGS_KEY = 'earthMindfulness.settings.v1';
const SESSIONS_KEY = 'earthMindfulness.sessions.v1';
const REMINDER_KEY = 'earthMindfulness.reminder.v1';

let memorySettings: AppSettings | null = null;
let memorySessions: SessionRecord[] = [];
let memoryReminderDate: string | null = null;

function inferDefaultLocation(): Pick<AppSettings, 'lat' | 'lon' | 'locationLabel' | 'locationSource'> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const exact = LOCATION_PRESETS.find((item) => item.timeZone === timeZone);
  if (exact) {
    return {
      lat: exact.lat,
      lon: exact.lon,
      locationLabel: `时区视角 · ${exact.name}`,
      locationSource: 'default'
    };
  }

  const offsetMinutes = -new Date().getTimezoneOffset();
  const inferredLongitude = Math.max(-180, Math.min(180, offsetMinutes / 4));
  return {
    lat: 20,
    lon: inferredLongitude,
    locationLabel: '按本地时区推测的视角',
    locationSource: 'default'
  };
}

export function defaultSettings(): AppSettings {
  return {
    ...inferDefaultLocation(),
    reminderEnabled: false,
    reminderTime: '20:30',
    voiceEnabled: true,
    ambientEnabled: true,
    reduceMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    language: 'zh'
  };
}

export function loadSettings(): AppSettings {
  const defaults = defaultSettings();
  if (memorySettings) return { ...memorySettings };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      memorySettings = defaults;
      return { ...defaults };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const lat = Number(parsed.lat);
    const lon = Number(parsed.lon);
    memorySettings = {
      ...defaults,
      ...parsed,
      lat: Number.isFinite(lat) ? Math.max(-90, Math.min(90, lat)) : defaults.lat,
      lon: Number.isFinite(lon) ? Math.max(-180, Math.min(180, lon)) : defaults.lon,
      language: parsed.language === 'en' ? 'en' : 'zh',
      reminderTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.reminderTime ?? '')
        ? parsed.reminderTime!
        : defaults.reminderTime
    };
    return { ...memorySettings };
  } catch {
    memorySettings = defaults;
    return { ...defaults };
  }
}

export function saveSettings(settings: AppSettings): void {
  memorySettings = { ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Keep the in-memory copy when storage is unavailable (for example, a sandboxed preview).
  }
}

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [...memorySessions];
    const parsed = JSON.parse(raw) as SessionRecord[];
    if (!Array.isArray(parsed)) return [...memorySessions];
    memorySessions = parsed
      .filter((item) => item && typeof item.startedAt === 'string' && Number.isFinite(item.durationMinutes))
      .slice(-200);
    return [...memorySessions];
  } catch {
    return [...memorySessions];
  }
}

export function saveSessions(records: SessionRecord[]): void {
  memorySessions = records.slice(-200).map((record) => ({ ...record }));
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(memorySessions));
  } catch {
    // In-memory history remains available for the current visit.
  }
}

export function addSession(record: SessionRecord): void {
  const records = loadSessions();
  records.push(record);
  saveSessions(records);
}

export function updateSessionMood(id: string, mood: string): void {
  const records = loadSessions();
  const item = records.find((record) => record.id === id);
  if (item) {
    item.mood = mood;
    saveSessions(records);
  }
}

export function clearSessions(): void {
  memorySessions = [];
  try {
    localStorage.removeItem(SESSIONS_KEY);
  } catch {
    // Nothing else to clear.
  }
}

export function getWeekStats(now = new Date()): { count: number; minutes: number } {
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day + 1);
  const records = loadSessions().filter((record) => record.completed && new Date(record.completedAt) >= monday);
  return {
    count: records.length,
    minutes: records.reduce((sum, record) => sum + record.durationMinutes, 0)
  };
}

export function getLastReminderDate(): string | null {
  try {
    return localStorage.getItem(REMINDER_KEY) ?? memoryReminderDate;
  } catch {
    return memoryReminderDate;
  }
}

export function setLastReminderDate(dateKey: string): void {
  memoryReminderDate = dateKey;
  try {
    localStorage.setItem(REMINDER_KEY, dateKey);
  } catch {
    // The reminder remains marked for the current visit.
  }
}
