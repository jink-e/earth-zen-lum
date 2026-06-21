import './styles.css';
import { createEarthView } from './earth';
import { UI_TEXT } from './i18n';
import { AmbientSound, getMeditationPlan, GuidanceVoice, type MeditationPlan } from './meditation';
import {
  LOCATION_PRESETS,
  addSession,
  clearSessions,
  getLastReminderDate,
  getWeekStats,
  loadSessions,
  loadSettings,
  saveSettings,
  setLastReminderDate,
  updateSessionMood,
  type AppSettings,
  type SessionRecord
} from './storage';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');

let settings: AppSettings = loadSettings();
const text = () => UI_TEXT[settings.language];

const icon = (path: string): string => `
  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path d="${path}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

const ICONS = {
  location: icon('M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'),
  target: icon('M12 2v3m0 14v3M2 12h3m14 0h3m-5.2 0a4.8 4.8 0 1 1-9.6 0 4.8 4.8 0 0 1 9.6 0Z'),
  settings: icon('M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7-3.2 2-1.2-2-3.5-2.3.5a7.6 7.6 0 0 0-1.7-1L14.3 4h-4.1l-.8 2.8a7.7 7.7 0 0 0-1.7 1L5.5 7.3l-2 3.5 2 1.2v2l-2 1.2 2 3.5 2.3-.5c.5.4 1.1.7 1.7 1l.7 2.8h4.1l.8-2.8c.6-.3 1.1-.6 1.7-1l2.3.5 2-3.5-2-1.2v-2Z'),
  history: icon('M4 4v5h5M5.4 18.6A9 9 0 1 0 4 9m8-2v5l3.2 1.8'),
  close: icon('m6 6 12 12M18 6 6 18'),
  pause: icon('M9 7v10M15 7v10'),
  play: icon('m9 7 8 5-8 5V7Z'),
  sound: icon('M5 10v4h3l4 3V7L8 10H5Zm10.2-.8a4 4 0 0 1 0 5.6M17.8 6.6a7.5 7.5 0 0 1 0 10.8'),
  mute: icon('M5 10v4h3l4 3V7L8 10H5Zm11-1 5 6m0-6-5 6'),
  voice: icon('M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0m-6 6v4m-3 0h6'),
  globe: icon('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.3-2.5 3.5-5.5 3.5-9S14.3 5.5 12 3m0 18c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3M3.5 9h17m-17 6h17'),
  install: icon('M12 3v12m0 0 4-4m-4 4-4-4M5 19h14')
};

function presetName(preset: (typeof LOCATION_PRESETS)[number]): string {
  return settings.language === 'en' ? preset.nameEn : preset.name;
}

function formatDurationLabel(minutes: number): string {
  const copy = text();
  return settings.language === 'en' ? `${minutes} ${copy.minuteUnit}` : `${minutes} ${copy.minuteUnit}`;
}

const MOOD_KEYS = ['calm', 'warm', 'spacious', 'heavy', 'unchanged'] as const;
type MoodKey = (typeof MOOD_KEYS)[number];

const LEGACY_MOODS: Record<string, MoodKey> = {
  平静: 'calm',
  温暖: 'warm',
  开阔: 'spacious',
  沉重: 'heavy',
  无明显变化: 'unchanged'
};

function isMoodKey(value: string): value is MoodKey {
  return (MOOD_KEYS as readonly string[]).includes(value);
}

function moodLabel(mood?: string): string | undefined {
  if (!mood) return undefined;
  const key = isMoodKey(mood) ? mood : LEGACY_MOODS[mood];
  return key ? text().moods[key] : mood;
}

const copy = text();
const initialPlans = [3, 7, 12].map((minutes) => getMeditationPlan(minutes, settings.language));

app.innerHTML = `
  <div class="app-shell" id="appShell">
    <div class="space-backdrop" aria-hidden="true"></div>
    <div class="earth-stage" id="earthStage"></div>

    <header class="topbar">
      <a class="brand" href="#" aria-label="${copy.brandHomeAria}">
        <span class="brand-mark"><span></span></span>
        <span>${copy.brand}</span>
      </a>
      <div class="top-actions">
        <button class="icon-button install-button" id="installButton" type="button" hidden aria-label="${copy.install}" title="${copy.install}">${ICONS.install}</button>
        <button class="icon-button" id="recenterButton" type="button" aria-label="${copy.recenter}" title="${copy.recenter}">${ICONS.target}</button>
        <button class="icon-button" id="settingsButton" type="button" aria-label="${copy.settingsButton}" title="${copy.settingsButton}">${ICONS.settings}</button>
      </div>
    </header>

    <main class="home-layout">
      <section class="hero-card" aria-labelledby="heroTitle">
        <div class="eyebrow-row">
          <span class="live-dot" aria-hidden="true"></span>
          <span id="weekdayTag">${copy.heroEyebrow}</span>
        </div>
        <h1 id="heroTitle">${copy.heroTitle}</h1>
        <p class="now-line" id="nowLine">${copy.nowLoading}</p>
        <div class="local-time-wrap">
          <time class="local-time" id="localTime">--:--</time>
          <div>
            <div class="local-date" id="localDate">--</div>
            <div class="timezone" id="timezoneLabel">--</div>
          </div>
        </div>
        <button class="location-pill" id="locationButton" type="button">
          ${ICONS.location}<span id="locationLabel">${copy.getLocation}</span>
        </button>
      </section>

      <section class="practice-panel" aria-labelledby="practiceTitle">
        <div class="panel-heading">
          <div>
            <p class="section-kicker">${copy.practiceKicker}</p>
            <h2 id="practiceTitle">${copy.practiceTitle}</h2>
          </div>
          <button class="history-button" id="historyButton" type="button">${ICONS.history}<span id="weekStats">${copy.weekStatsEmpty}</span></button>
        </div>

        <div class="duration-grid">
          <button class="duration-card" type="button" data-minutes="3">
            <span class="duration-number">3</span><span class="duration-unit">${copy.minuteUnit}</span>
            <strong>${initialPlans[0]!.title}</strong><small>${initialPlans[0]!.subtitle}</small>
          </button>
          <button class="duration-card featured" type="button" data-minutes="7">
            <span class="recommended">${copy.recommended}</span>
            <span class="duration-number">7</span><span class="duration-unit">${copy.minuteUnit}</span>
            <strong>${initialPlans[1]!.title}</strong><small>${initialPlans[1]!.subtitle}</small>
          </button>
          <button class="duration-card" type="button" data-minutes="12">
            <span class="duration-number">12</span><span class="duration-unit">${copy.minuteUnit}</span>
            <strong>${initialPlans[2]!.title}</strong><small>${initialPlans[2]!.subtitle}</small>
          </button>
        </div>

        <button class="wednesday-card" id="wednesdayCard" type="button">
          <span class="wednesday-orbit" aria-hidden="true"><span></span></span>
          <span class="wednesday-copy">
            <small id="wednesdayEyebrow">${copy.wednesdayDefaultEyebrow}</small>
            <strong id="wednesdayTitle">${copy.wednesdayTitle}</strong>
            <span id="wednesdayBody">${copy.wednesdayBody}</span>
          </span>
          <span class="wednesday-action">${copy.wednesdayAction} <span aria-hidden="true">→</span></span>
        </button>
      </section>
    </main>

    <footer class="app-footer">
      <span>${copy.footerEphemeris}</span>
      <span aria-hidden="true">·</span>
      <span>${copy.footerImagery}</span>
    </footer>
  </div>

  <section class="meditation-overlay" id="meditationOverlay" hidden aria-label="${copy.practiceKicker}">
    <div class="meditation-topbar">
      <button class="round-control" id="endSessionButton" type="button" aria-label="${copy.endSession}">${ICONS.close}</button>
      <div class="session-title-wrap">
        <span id="sessionDuration">${formatDurationLabel(7)}</span>
        <strong id="sessionTitle">${initialPlans[1]!.title}</strong>
      </div>
      <div class="meditation-top-actions">
        <button class="round-control" id="voiceButton" type="button" aria-label="${copy.voiceToggle}">${ICONS.voice}</button>
        <button class="round-control" id="soundButton" type="button" aria-label="${copy.soundToggle}">${ICONS.sound}</button>
      </div>
    </div>

    <div class="meditation-content">
      <div class="breath-visual" id="breathVisual" aria-hidden="true">
        <span class="breath-ring ring-one"></span>
        <span class="breath-ring ring-two"></span>
        <span class="breath-core"></span>
      </div>
      <p class="breath-label" id="breathLabel">${copy.naturalBreath}</p>
      <p class="guidance-text" id="guidanceText" aria-live="polite">${copy.initialGuidance}</p>
    </div>

    <div class="meditation-controls">
      <div class="progress-track" aria-hidden="true"><span id="progressBar"></span></div>
      <div class="timer-row">
        <span id="elapsedTime">00:00</span>
        <button class="pause-button" id="pauseButton" type="button">${ICONS.pause}<span>${copy.pause}</span></button>
        <span id="remainingTime">07:00</span>
      </div>
    </div>
  </section>

  <dialog class="app-dialog settings-dialog" id="settingsDialog">
    <div class="dialog-header">
      <div><p class="section-kicker">${copy.settingsKicker}</p><h2>${copy.settingsTitle}</h2></div>
      <button class="icon-button dialog-close" type="button" aria-label="${copy.closeSettings}">${ICONS.close}</button>
    </div>
    <div class="dialog-body settings-body">
      <section class="setting-section">
        <div class="setting-title">${ICONS.location}<div><strong>${copy.earthViewTitle}</strong><span>${copy.earthViewHelp}</span></div></div>
        <div class="current-location-card"><span>${copy.current}</span><strong id="settingsLocationLabel">--</strong></div>
        <button class="secondary-button full-width" id="gpsButton" type="button">${ICONS.target}<span>${copy.useDeviceLocation}</span></button>
        <label class="field-label" for="citySelect">${copy.cityLabel}</label>
        <select id="citySelect" class="form-control"><option value="">${copy.cityPlaceholder}</option></select>
        <details class="manual-location">
          <summary>${copy.manualCoordinates}</summary>
          <div class="coordinate-grid">
            <label>${copy.latitude}<input class="form-control" id="latitudeInput" type="number" min="-90" max="90" step="0.0001" /></label>
            <label>${copy.longitude}<input class="form-control" id="longitudeInput" type="number" min="-180" max="180" step="0.0001" /></label>
          </div>
          <button class="secondary-button full-width" id="applyCoordinatesButton" type="button">${copy.applyCoordinates}</button>
        </details>
      </section>

      <section class="setting-section">
        <div class="setting-title">${ICONS.globe}<div><strong>${copy.reminderTitle}</strong><span>${copy.reminderHelp}</span></div></div>
        <label class="setting-row"><span><strong>${copy.reminderEnabled}</strong><small id="notificationStatus">${copy.reminderOff}</small></span><input id="reminderToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
        <label class="time-setting"><span>${copy.reminderTime}</span><input class="form-control" id="reminderTime" type="time" /></label>
      </section>

      <section class="setting-section">
        <label class="time-setting language-setting"><span><strong>${copy.languageTitle}</strong><small>${copy.languageHelp}</small></span><select id="languageSelect" class="form-control"><option value="zh"${settings.language === 'zh' ? ' selected' : ''}>中文</option><option value="en"${settings.language === 'en' ? ' selected' : ''}>English</option></select></label>
        <label class="setting-row"><span><strong>${copy.voiceTitle}</strong><small>${copy.voiceHelp}</small></span><input id="voiceToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
        <label class="setting-row"><span><strong>${copy.ambientTitle}</strong><small>${copy.ambientHelp}</small></span><input id="ambientToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
        <label class="setting-row"><span><strong>${copy.motionTitle}</strong><small>${copy.motionHelp}</small></span><input id="motionToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
      </section>

      <section class="setting-section credits-section">
        <strong>${copy.creditsTitle}</strong>
        <p>${copy.creditsBody}</p>
      </section>

      <button class="danger-text-button" id="clearHistoryButton" type="button">${copy.clearHistory}</button>
    </div>
  </dialog>

  <dialog class="app-dialog history-dialog" id="historyDialog">
    <div class="dialog-header">
      <div><p class="section-kicker">${copy.historyKicker}</p><h2>${copy.historyTitle}</h2></div>
      <button class="icon-button dialog-close" type="button" aria-label="${copy.closeHistory}">${ICONS.close}</button>
    </div>
    <div class="dialog-body">
      <div class="history-summary">
        <div><strong id="historyCount">0</strong><span>${copy.weekPractice}</span></div>
        <div><strong id="historyMinutes">0</strong><span>${copy.weekMinutes}</span></div>
      </div>
      <div class="history-list" id="historyList"></div>
    </div>
  </dialog>

  <dialog class="app-dialog mood-dialog" id="moodDialog">
    <div class="dialog-header compact">
      <div><p class="section-kicker">${copy.moodKicker}</p><h2>${copy.moodTitle}</h2></div>
      <button class="icon-button dialog-close" type="button" aria-label="${copy.skipMood}">${ICONS.close}</button>
    </div>
    <div class="dialog-body">
      <p class="mood-note">${copy.moodNote}</p>
      <div class="mood-grid">
        <button type="button" data-mood="calm"><span>◌</span>${copy.moods.calm}</button>
        <button type="button" data-mood="warm"><span>☼</span>${copy.moods.warm}</button>
        <button type="button" data-mood="spacious"><span>∞</span>${copy.moods.spacious}</button>
        <button type="button" data-mood="heavy"><span>◐</span>${copy.moods.heavy}</button>
        <button type="button" data-mood="unchanged"><span>—</span>${copy.moods.unchanged}</button>
      </div>
    </div>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

function query<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

const appShell = query<HTMLDivElement>('#appShell');
const earthStage = query<HTMLDivElement>('#earthStage');
const earth = createEarthView(earthStage);
earth.setReduceMotion(settings.reduceMotion);
earth.setLocation(settings.lat, settings.lon, false);

const localTime = query<HTMLTimeElement>('#localTime');
const localDate = query<HTMLDivElement>('#localDate');
const timezoneLabel = query<HTMLDivElement>('#timezoneLabel');
const weekdayTag = query<HTMLSpanElement>('#weekdayTag');
const nowLine = query<HTMLParagraphElement>('#nowLine');
const locationLabel = query<HTMLSpanElement>('#locationLabel');
const settingsLocationLabel = query<HTMLElement>('#settingsLocationLabel');
const weekStats = query<HTMLSpanElement>('#weekStats');
const wednesdayCard = query<HTMLButtonElement>('#wednesdayCard');
const wednesdayEyebrow = query<HTMLElement>('#wednesdayEyebrow');
const wednesdayTitle = query<HTMLElement>('#wednesdayTitle');
const wednesdayBody = query<HTMLElement>('#wednesdayBody');
const toastElement = query<HTMLDivElement>('#toast');
const settingsDialog = query<HTMLDialogElement>('#settingsDialog');
const historyDialog = query<HTMLDialogElement>('#historyDialog');
const moodDialog = query<HTMLDialogElement>('#moodDialog');
const citySelect = query<HTMLSelectElement>('#citySelect');
const latitudeInput = query<HTMLInputElement>('#latitudeInput');
const longitudeInput = query<HTMLInputElement>('#longitudeInput');
const languageSelect = query<HTMLSelectElement>('#languageSelect');
const reminderToggle = query<HTMLInputElement>('#reminderToggle');
const reminderTime = query<HTMLInputElement>('#reminderTime');
const voiceToggle = query<HTMLInputElement>('#voiceToggle');
const ambientToggle = query<HTMLInputElement>('#ambientToggle');
const motionToggle = query<HTMLInputElement>('#motionToggle');
const notificationStatus = query<HTMLElement>('#notificationStatus');

document.documentElement.lang = settings.language === 'en' ? 'en' : 'zh-CN';
document.title = text().documentTitle;

function renderCityOptions(): void {
  const selectedValue = citySelect.value;
  citySelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = text().cityPlaceholder;
  citySelect.append(placeholder);
  for (const [index, preset] of LOCATION_PRESETS.entries()) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = presetName(preset);
    citySelect.append(option);
  }
  citySelect.value = selectedValue;
}

function matchingPreset(): (typeof LOCATION_PRESETS)[number] | undefined {
  return LOCATION_PRESETS.find(
    (preset) => Math.abs(preset.lat - settings.lat) < 0.001 && Math.abs(preset.lon - settings.lon) < 0.001
  );
}

function displayLocationLabel(): string {
  const copy = text();
  const preset = matchingPreset();
  if (settings.locationSource === 'gps') return `${copy.myLocation} · ${coordinateLabel(settings.lat, settings.lon)}`;
  if (settings.locationSource === 'manual') return `${copy.manualLocation} · ${coordinateLabel(settings.lat, settings.lon)}`;
  if (preset) {
    const prefix = settings.locationSource === 'default' ? copy.timezonePerspective : '';
    return prefix ? `${prefix} · ${presetName(preset)}` : presetName(preset);
  }
  return settings.locationSource === 'default'
    ? copy.inferredPerspective
    : settings.locationLabel;
}

renderCityOptions();

function openDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

for (const closeButton of document.querySelectorAll<HTMLButtonElement>('.dialog-close')) {
  closeButton.addEventListener('click', () => {
    const dialog = closeButton.closest('dialog');
    if (dialog instanceof HTMLDialogElement) closeDialog(dialog);
  });
}

for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
}

let toastTimer = 0;
function showToast(message: string, duration = 2800): void {
  window.clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add('show');
  toastTimer = window.setTimeout(() => toastElement.classList.remove('show'), duration);
}

function coordinateLabel(lat: number, lon: number): string {
  const latText = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonText = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latText} · ${lonText}`;
}

function saveAndApplySettings(recenter = false): void {
  saveSettings(settings);
  earth.setReduceMotion(settings.reduceMotion);
  if (recenter) earth.setLocation(settings.lat, settings.lon, true);
  syncSettingsUi();
  updateClock();
}

function notificationStateText(): string {
  const copy = text();
  if (!('Notification' in window)) return copy.notificationUnsupported;
  if (!window.isSecureContext) return copy.notificationInsecure;
  if (Notification.permission === 'granted') return copy.notificationGranted;
  if (Notification.permission === 'denied') return copy.notificationDenied;
  return copy.notificationDefault;
}

function syncSettingsUi(): void {
  renderCityOptions();
  const copy = text();
  const locationText = displayLocationLabel();
  locationLabel.textContent = locationText;
  settingsLocationLabel.textContent = `${locationText} · ${coordinateLabel(settings.lat, settings.lon)}`;
  latitudeInput.value = settings.lat.toFixed(4);
  longitudeInput.value = settings.lon.toFixed(4);
  languageSelect.value = settings.language;
  reminderToggle.checked = settings.reminderEnabled;
  reminderTime.value = settings.reminderTime;
  voiceToggle.checked = settings.voiceEnabled;
  ambientToggle.checked = settings.ambientEnabled;
  motionToggle.checked = settings.reduceMotion;
  notificationStatus.textContent = settings.reminderEnabled ? notificationStateText() : copy.reminderOff;

  const matchingIndex = LOCATION_PRESETS.findIndex((preset) => preset === matchingPreset());
  citySelect.value = matchingIndex >= 0 ? String(matchingIndex) : '';
}

function nextWednesdayText(now: Date): string {
  const copy = text();
  const today = now.getDay();
  const days = (3 - today + 7) % 7 || 7;
  if (days === 1) return copy.tomorrow;
  return copy.daysLater(days);
}

function updateClock(): void {
  const copy = text();
  const now = new Date();
  localTime.textContent = new Intl.DateTimeFormat(copy.locale, {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(now);
  localTime.dateTime = now.toISOString();
  localDate.textContent = new Intl.DateTimeFormat(copy.locale, {
    month: 'long', day: 'numeric', weekday: 'long'
  }).format(now);
  timezoneLabel.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || copy.fallbackTimeZone;

  const hour = now.getHours();
  const timePhrase = hour < 5 ? copy.timePhrases.deepNight : hour < 9 ? copy.timePhrases.morning : hour < 12 ? copy.timePhrases.lateMorning : hour < 17 ? copy.timePhrases.afternoon : hour < 20 ? copy.timePhrases.evening : copy.timePhrases.night;
  const state = earth.getDayState();
  const statePhrase = state === 'day'
    ? copy.dayState.day
    : state === 'night'
      ? copy.dayState.night
      : copy.dayState.twilight;
  nowLine.textContent = settings.language === 'en' ? `${timePhrase}. ${statePhrase}` : `${timePhrase}。${statePhrase}`;

  if (now.getDay() === 3) {
    weekdayTag.textContent = copy.wednesdayTodayEyebrow;
    wednesdayCard.classList.add('is-today');
    wednesdayEyebrow.textContent = copy.todayWednesday;
    wednesdayTitle.textContent = copy.wednesdayTodayTitle;
    wednesdayBody.textContent = copy.wednesdayTodayBody;
  } else {
    weekdayTag.textContent = copy.heroEyebrow;
    wednesdayCard.classList.remove('is-today');
    wednesdayEyebrow.textContent = `${nextWednesdayText(now)} · ${copy.wednesday}`;
    wednesdayTitle.textContent = copy.wednesdayTitle;
    wednesdayBody.textContent = copy.wednesdayBody;
  }
}

function updateStats(): void {
  const copy = text();
  const stats = getWeekStats();
  weekStats.textContent = stats.count ? copy.weekStats(stats.count, stats.minutes) : copy.weekStatsEmpty;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function checkWednesdayReminder(): void {
  if (!settings.reminderEnabled) return;
  const copy = text();
  const now = new Date();
  if (now.getDay() !== 3) return;
  const [hourText = '20', minuteText = '30'] = settings.reminderTime.split(':');
  const reminderMinutes = Number(hourText) * 60 + Number(minuteText);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const key = dateKey(now);
  if (currentMinutes < reminderMinutes || getLastReminderDate() === key) return;

  const title = copy.notificationTitle;
  const body = copy.notificationBody;
  if ('Notification' in window && window.isSecureContext && Notification.permission === 'granted') {
    new Notification(title, { body, icon: './icons/icon-192.png', tag: 'earth-wednesday' });
  }
  showToast(settings.language === 'en' ? `${title}: ${body}` : `${title}：${body}`, 5000);
  setLastReminderDate(key);
}

async function useDeviceLocation(): Promise<void> {
  const buttons = [query<HTMLButtonElement>('#locationButton'), query<HTMLButtonElement>('#gpsButton')];
  const copy = text();
  if (!('geolocation' in navigator)) {
    showToast(copy.geolocationUnsupported);
    return;
  }
  if (!window.isSecureContext && location.protocol !== 'file:') {
    showToast(copy.geolocationInsecure);
    return;
  }
  for (const button of buttons) button.disabled = true;
  showToast(copy.geolocationLoading);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      settings = {
        ...settings,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        locationLabel: `${copy.myLocation} · ${coordinateLabel(position.coords.latitude, position.coords.longitude)}`,
        locationSource: 'gps'
      };
      saveAndApplySettings(true);
      for (const button of buttons) button.disabled = false;
      showToast(copy.geolocationApplied);
    },
    (error) => {
      for (const button of buttons) button.disabled = false;
      const message = error.code === error.PERMISSION_DENIED
        ? copy.geolocationDenied
        : copy.geolocationFailed;
      showToast(message, 4200);
    },
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 3_600_000 }
  );
}

query<HTMLButtonElement>('#locationButton').addEventListener('click', () => void useDeviceLocation());
query<HTMLButtonElement>('#gpsButton').addEventListener('click', () => void useDeviceLocation());
query<HTMLButtonElement>('#recenterButton').addEventListener('click', () => {
  earth.recenter();
  showToast(text().recentered);
});
query<HTMLButtonElement>('#settingsButton').addEventListener('click', () => {
  syncSettingsUi();
  openDialog(settingsDialog);
});

citySelect.addEventListener('change', () => {
  if (!citySelect.value) return;
  const preset = LOCATION_PRESETS[Number(citySelect.value)];
  if (!preset) return;
  settings = {
    ...settings,
    lat: preset.lat,
    lon: preset.lon,
    locationLabel: presetName(preset),
    locationSource: 'preset'
  };
  saveAndApplySettings(true);
  showToast(text().cityApplied(presetName(preset)));
});

query<HTMLButtonElement>('#applyCoordinatesButton').addEventListener('click', () => {
  const copy = text();
  const lat = Number(latitudeInput.value);
  const lon = Number(longitudeInput.value);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    showToast(copy.invalidCoordinates, 4200);
    return;
  }
  settings = {
    ...settings,
    lat,
    lon,
    locationLabel: `${copy.manualLocation} · ${coordinateLabel(lat, lon)}`,
    locationSource: 'manual'
  };
  saveAndApplySettings(true);
  showToast(copy.manualApplied);
});

languageSelect.addEventListener('change', () => {
  const nextLanguage = languageSelect.value === 'en' ? 'en' : 'zh';
  if (settings.language === nextLanguage) return;
  settings = { ...settings, language: nextLanguage };
  saveSettings(settings);
  window.location.reload();
});

reminderToggle.addEventListener('change', async () => {
  const copy = text();
  const enabled = reminderToggle.checked;
  settings.reminderEnabled = enabled;
  if (enabled && 'Notification' in window && window.isSecureContext && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') showToast(copy.notificationBlocked, 4200);
    else if (permission === 'granted') showToast(copy.reminderEnabledToast);
  } else if (enabled) {
    showToast(copy.reminderInAppToast);
  }
  saveAndApplySettings();
  checkWednesdayReminder();
});

reminderTime.addEventListener('change', () => {
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime.value)) {
    settings.reminderTime = reminderTime.value;
    saveAndApplySettings();
    showToast(text().reminderTimeSet(reminderTime.value));
  }
});

voiceToggle.addEventListener('change', () => {
  settings.voiceEnabled = voiceToggle.checked;
  saveAndApplySettings();
});
ambientToggle.addEventListener('change', () => {
  settings.ambientEnabled = ambientToggle.checked;
  saveAndApplySettings();
});
motionToggle.addEventListener('change', () => {
  settings.reduceMotion = motionToggle.checked;
  saveAndApplySettings();
});

query<HTMLButtonElement>('#clearHistoryButton').addEventListener('click', () => {
  if (!window.confirm(text().confirmClearHistory)) return;
  clearSessions();
  updateStats();
  renderHistory();
  showToast(text().historyCleared);
});

function renderHistory(): void {
  const stats = getWeekStats();
  query<HTMLElement>('#historyCount').textContent = String(stats.count);
  query<HTMLElement>('#historyMinutes').textContent = String(stats.minutes);
  const list = query<HTMLDivElement>('#historyList');
  list.replaceChildren();
  const sessions = loadSessions().sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  if (!sessions.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const copy = text();
    empty.innerHTML = `<span>◯</span><strong>${copy.emptyHistoryTitle}</strong><p>${copy.emptyHistoryBody}</p>`;
    list.append(empty);
    return;
  }

  for (const session of sessions.slice(0, 30)) {
    const copy = text();
    const item = document.createElement('article');
    item.className = `history-item${session.completed ? '' : ' incomplete'}`;
    const date = new Date(session.startedAt);
    const title = document.createElement('div');
    title.className = 'history-item-title';
    const strong = document.createElement('strong');
    strong.textContent = `${formatDurationLabel(session.durationMinutes)} · ${getMeditationPlan(session.durationMinutes, settings.language).title}`;
    const status = document.createElement('span');
    status.textContent = session.completed ? (moodLabel(session.mood) ?? copy.completed) : copy.endedEarly;
    title.append(strong, status);
    const meta = document.createElement('p');
    meta.textContent = new Intl.DateTimeFormat(copy.locale, {
      month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
    item.append(title, meta);
    list.append(item);
  }
}

query<HTMLButtonElement>('#historyButton').addEventListener('click', () => {
  renderHistory();
  openDialog(historyDialog);
});

interface ActiveSession {
  plan: MeditationPlan;
  startedAtIso: string;
  startedAtMs: number;
  pausedAtMs: number | null;
  pausedTotalMs: number;
  cueIndex: number;
  frame: number;
  ambient: AmbientSound;
  voice: GuidanceVoice;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}

let activeSession: ActiveSession | null = null;
let pendingMoodRecordId: string | null = null;
const meditationOverlay = query<HTMLElement>('#meditationOverlay');
const sessionDuration = query<HTMLElement>('#sessionDuration');
const sessionTitle = query<HTMLElement>('#sessionTitle');
const breathVisual = query<HTMLElement>('#breathVisual');
const breathLabel = query<HTMLElement>('#breathLabel');
const guidanceText = query<HTMLElement>('#guidanceText');
const progressBar = query<HTMLElement>('#progressBar');
const elapsedTime = query<HTMLElement>('#elapsedTime');
const remainingTime = query<HTMLElement>('#remainingTime');
const pauseButton = query<HTMLButtonElement>('#pauseButton');
const soundButton = query<HTMLButtonElement>('#soundButton');
const voiceButton = query<HTMLButtonElement>('#voiceButton');

const fastDemo = new URLSearchParams(window.location.search).get('demo') === 'fast';

function formatTimer(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function sessionDurationSeconds(plan: MeditationPlan): number {
  return fastDemo ? plan.minutes * 6 : plan.minutes * 60;
}

function getSessionElapsedMs(session: ActiveSession): number {
  const end = session.pausedAtMs ?? performance.now();
  return Math.max(0, end - session.startedAtMs - session.pausedTotalMs);
}

function updateSessionButtons(): void {
  if (!activeSession) return;
  const paused = activeSession.pausedAtMs !== null;
  const copy = text();
  pauseButton.innerHTML = paused ? `${ICONS.play}<span>${copy.resume}</span>` : `${ICONS.pause}<span>${copy.pause}</span>`;
  soundButton.innerHTML = activeSession.soundEnabled ? ICONS.sound : ICONS.mute;
  soundButton.classList.toggle('is-off', !activeSession.soundEnabled);
  voiceButton.classList.toggle('is-off', !activeSession.voiceEnabled);
}

function renderSessionFrame(): void {
  const session = activeSession;
  if (!session) return;
  const duration = sessionDurationSeconds(session.plan);
  const elapsedSecondsValue = getSessionElapsedMs(session) / 1000;
  const progress = Math.min(1, elapsedSecondsValue / duration);
  const cues = session.plan.cues;
  let cueIndex = 0;
  for (let index = 0; index < cues.length; index += 1) {
    if (progress >= (cues[index]?.at ?? 1)) cueIndex = index;
    else break;
  }

  if (cueIndex !== session.cueIndex) {
    session.cueIndex = cueIndex;
    const cue = cues[cueIndex];
    if (cue) {
      guidanceText.textContent = cue.text;
      breathLabel.textContent = cue.breath ?? text().naturalBreath;
      if (session.voiceEnabled && session.pausedAtMs === null) session.voice.speak(cue.text, settings.language);
    }
  }

  progressBar.style.width = `${progress * 100}%`;
  elapsedTime.textContent = formatTimer(elapsedSecondsValue);
  remainingTime.textContent = formatTimer(duration - elapsedSecondsValue);
  const breathPhase = session.pausedAtMs === null ? 0.5 - 0.5 * Math.cos((elapsedSecondsValue / 8) * Math.PI * 2) : 0.15;
  breathVisual.style.setProperty('--breath-scale-one', (0.92 + breathPhase * 0.34).toFixed(3));
  breathVisual.style.setProperty('--breath-scale-two', (0.94 + breathPhase * 0.23).toFixed(3));
  breathVisual.style.setProperty('--breath-scale-core', (0.82 + breathPhase * 0.48).toFixed(3));
  breathVisual.style.setProperty('--breath-opacity-one', (0.45 - breathPhase * 0.16).toFixed(3));
  breathVisual.style.setProperty('--breath-opacity-two', (0.20 + breathPhase * 0.14).toFixed(3));
  earth.setBreathPhase(breathPhase);
  document.title = `${formatTimer(duration - elapsedSecondsValue)} · ${session.plan.title}`;

  if (progress >= 1) {
    void finishSession(true);
    return;
  }
  session.frame = requestAnimationFrame(renderSessionFrame);
}

async function startSession(minutes: number): Promise<void> {
  if (activeSession) return;
  const copy = text();
  const plan = getMeditationPlan(minutes, settings.language);
  const ambient = new AmbientSound();
  const voice = new GuidanceVoice();
  const startedAtIso = new Date().toISOString();
  activeSession = {
    plan,
    startedAtIso,
    startedAtMs: performance.now(),
    pausedAtMs: null,
    pausedTotalMs: 0,
    cueIndex: 0,
    frame: 0,
    ambient,
    voice,
    soundEnabled: settings.ambientEnabled,
    voiceEnabled: settings.voiceEnabled
  };

  sessionDuration.textContent = formatDurationLabel(plan.minutes);
  sessionTitle.textContent = plan.title;
  guidanceText.textContent = plan.cues[0]?.text ?? copy.initialGuidance;
  breathLabel.textContent = plan.cues[0]?.breath ?? copy.naturalBreath;
  elapsedTime.textContent = '00:00';
  remainingTime.textContent = formatTimer(sessionDurationSeconds(plan));
  progressBar.style.width = '0%';
  updateSessionButtons();

  appShell.classList.add('is-meditating');
  meditationOverlay.hidden = false;
  requestAnimationFrame(() => meditationOverlay.classList.add('active'));
  earth.beginMeditation();

  voice.setEnabled(settings.voiceEnabled);
  const session = activeSession;
  session.frame = requestAnimationFrame(renderSessionFrame);

  if (settings.ambientEnabled) {
    try {
      await ambient.start();
      if (activeSession === session) await ambient.chime();
    } catch {
      if (activeSession === session) {
        session.soundEnabled = false;
        updateSessionButtons();
      }
    }
  }
  window.setTimeout(() => {
    if (activeSession === session && session.voiceEnabled) {
      voice.speak(plan.cues[0]?.text ?? copy.initialGuidance, settings.language);
    }
  }, settings.reduceMotion ? 100 : 900);
}

function createSessionId(): string {
  return crypto.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function finishSession(completed: boolean): Promise<void> {
  const session = activeSession;
  if (!session) return;
  activeSession = null;
  cancelAnimationFrame(session.frame);
  const elapsedSecondsValue = Math.round(getSessionElapsedMs(session) / 1000);
  session.voice.cancel();
  if (completed && session.soundEnabled) {
    await session.ambient.chime();
    window.setTimeout(() => session.ambient.stop(), 1300);
  } else {
    session.ambient.stop();
  }

  const record: SessionRecord = {
    id: createSessionId(),
    startedAt: session.startedAtIso,
    completedAt: new Date().toISOString(),
    durationMinutes: session.plan.minutes,
    elapsedSeconds: elapsedSecondsValue,
    completed
  };
  addSession(record);
  pendingMoodRecordId = completed ? record.id : null;

  meditationOverlay.classList.remove('active');
  appShell.classList.remove('is-meditating');
  window.setTimeout(() => { meditationOverlay.hidden = true; }, 420);
  earth.endMeditation();
  document.title = text().documentTitle;
  updateStats();

  if (completed) {
    showToast(text().sessionComplete(session.plan.minutes), 4200);
    window.setTimeout(() => openDialog(moodDialog), 650);
  } else {
    showToast(text().sessionEnded, 3800);
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-minutes]')) {
  button.addEventListener('click', () => void startSession(Number(button.dataset.minutes)));
}
wednesdayCard.addEventListener('click', () => void startSession(7));

query<HTMLButtonElement>('#endSessionButton').addEventListener('click', () => {
  if (!activeSession) return;
  const elapsed = getSessionElapsedMs(activeSession) / 1000;
  if (elapsed > 15 && !window.confirm(text().confirmEndSession)) return;
  void finishSession(false);
});

pauseButton.addEventListener('click', () => {
  const session = activeSession;
  if (!session) return;
  if (session.pausedAtMs === null) {
    session.pausedAtMs = performance.now();
    session.voice.cancel();
    session.ambient.setMuted(true);
    guidanceText.dataset.beforePause = guidanceText.textContent ?? '';
    guidanceText.textContent = text().pausedGuidance;
    breathLabel.textContent = text().pausedLabel;
    earth.setMeditationPaused(true);
  } else {
    session.pausedTotalMs += performance.now() - session.pausedAtMs;
    session.pausedAtMs = null;
    session.ambient.setMuted(!session.soundEnabled);
    const cue = session.plan.cues[session.cueIndex];
    guidanceText.textContent = cue?.text ?? guidanceText.dataset.beforePause ?? '';
    breathLabel.textContent = cue?.breath ?? text().naturalBreath;
    if (session.voiceEnabled && cue) session.voice.speak(cue.text, settings.language);
    earth.setMeditationPaused(false);
  }
  updateSessionButtons();
});

soundButton.addEventListener('click', () => {
  const session = activeSession;
  if (!session) return;
  session.soundEnabled = !session.soundEnabled;
  settings.ambientEnabled = session.soundEnabled;
  saveSettings(settings);
  if (session.soundEnabled) {
    void session.ambient.start().then(() => session.ambient.setMuted(session.pausedAtMs !== null));
  } else {
    session.ambient.setMuted(true);
  }
  updateSessionButtons();
});

voiceButton.addEventListener('click', () => {
  const session = activeSession;
  if (!session) return;
  session.voiceEnabled = !session.voiceEnabled;
  settings.voiceEnabled = session.voiceEnabled;
  saveSettings(settings);
  session.voice.setEnabled(session.voiceEnabled);
  if (session.voiceEnabled && session.pausedAtMs === null) {
    const cue = session.plan.cues[session.cueIndex];
    if (cue) session.voice.speak(cue.text, settings.language);
  }
  updateSessionButtons();
});

for (const moodButton of document.querySelectorAll<HTMLButtonElement>('[data-mood]')) {
  moodButton.addEventListener('click', () => {
    const mood = moodButton.dataset.mood;
    if (pendingMoodRecordId && mood) updateSessionMood(pendingMoodRecordId, mood);
    pendingMoodRecordId = null;
    closeDialog(moodDialog);
    showToast(mood === 'unchanged' ? text().moodRecorded : text().moodRecordedWithValue(moodLabel(mood) ?? ''));
  });
}

query<HTMLAnchorElement>('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  earth.recenter();
});

let deferredInstallPrompt: Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> } | null = null;
const installButton = query<HTMLButtonElement>('#installButton');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event as typeof deferredInstallPrompt;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt?.prompt) return;
  await deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice?.outcome === 'accepted') installButton.hidden = true;
  deferredInstallPrompt = null;
});
window.addEventListener('appinstalled', () => {
  installButton.hidden = true;
  showToast(text().installed);
});

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateClock();
    checkWednesdayReminder();
  }
});
window.addEventListener('beforeunload', (event) => {
  if (!activeSession) return;
  event.preventDefault();
});

syncSettingsUi();
updateClock();
updateStats();
checkWednesdayReminder();
window.setInterval(updateClock, 1000);
window.setInterval(checkWednesdayReminder, 60_000);
