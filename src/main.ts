import './styles.css';
import { createEarthView } from './earth';
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

app.innerHTML = `
  <div class="app-shell" id="appShell">
    <div class="space-backdrop" aria-hidden="true"></div>
    <div class="earth-stage" id="earthStage"></div>

    <header class="topbar">
      <a class="brand" href="#" aria-label="此刻地球首页">
        <span class="brand-mark"><span></span></span>
        <span>此刻地球</span>
      </a>
      <div class="top-actions">
        <button class="icon-button install-button" id="installButton" type="button" hidden aria-label="安装应用" title="安装应用">${ICONS.install}</button>
        <button class="icon-button" id="recenterButton" type="button" aria-label="回到我的位置" title="回到我的位置">${ICONS.target}</button>
        <button class="icon-button" id="settingsButton" type="button" aria-label="打开设置" title="设置">${ICONS.settings}</button>
      </div>
    </header>

    <main class="home-layout">
      <section class="hero-card" aria-labelledby="heroTitle">
        <div class="eyebrow-row">
          <span class="live-dot" aria-hidden="true"></span>
          <span id="weekdayTag">此刻 · 真实昼夜</span>
        </div>
        <h1 id="heroTitle">看见此刻的地球<br />也看见此刻的自己</h1>
        <p class="now-line" id="nowLine">正在计算你所在位置的昼夜状态…</p>
        <div class="local-time-wrap">
          <time class="local-time" id="localTime">--:--</time>
          <div>
            <div class="local-date" id="localDate">--</div>
            <div class="timezone" id="timezoneLabel">--</div>
          </div>
        </div>
        <button class="location-pill" id="locationButton" type="button">
          ${ICONS.location}<span id="locationLabel">获取位置</span>
        </button>
      </section>

      <section class="practice-panel" aria-labelledby="practiceTitle">
        <div class="panel-heading">
          <div>
            <p class="section-kicker">正念观想</p>
            <h2 id="practiceTitle">留几分钟给地球</h2>
          </div>
          <button class="history-button" id="historyButton" type="button">${ICONS.history}<span id="weekStats">本周 0 次</span></button>
        </div>

        <div class="duration-grid">
          <button class="duration-card" type="button" data-minutes="3">
            <span class="duration-number">3</span><span class="duration-unit">分钟</span>
            <strong>回到此刻</strong><small>短暂安顿身心</small>
          </button>
          <button class="duration-card featured" type="button" data-minutes="7">
            <span class="recommended">推荐</span>
            <span class="duration-number">7</span><span class="duration-unit">分钟</span>
            <strong>拥抱地球</strong><small>完整地球观想</small>
          </button>
          <button class="duration-card" type="button" data-minutes="12">
            <span class="duration-number">12</span><span class="duration-unit">分钟</span>
            <strong>和平观想</strong><small>扩展善意与关怀</small>
          </button>
        </div>

        <button class="wednesday-card" id="wednesdayCard" type="button">
          <span class="wednesday-orbit" aria-hidden="true"><span></span></span>
          <span class="wednesday-copy">
            <small id="wednesdayEyebrow">每周三</small>
            <strong id="wednesdayTitle">地球和平观想</strong>
            <span id="wednesdayBody">为共同生活的地球，留下一段安静。</span>
          </span>
          <span class="wednesday-action">开始 7 分钟 <span aria-hidden="true">→</span></span>
        </button>
      </section>
    </main>

    <footer class="app-footer">
      <span>昼夜分布依据当前时间计算</span>
      <span aria-hidden="true">·</span>
      <span>地表影像非实时卫星照片</span>
    </footer>
  </div>

  <section class="meditation-overlay" id="meditationOverlay" hidden aria-label="冥想练习">
    <div class="meditation-topbar">
      <button class="round-control" id="endSessionButton" type="button" aria-label="结束练习">${ICONS.close}</button>
      <div class="session-title-wrap">
        <span id="sessionDuration">7 分钟</span>
        <strong id="sessionTitle">拥抱地球</strong>
      </div>
      <div class="meditation-top-actions">
        <button class="round-control" id="voiceButton" type="button" aria-label="开启或关闭语音引导">${ICONS.voice}</button>
        <button class="round-control" id="soundButton" type="button" aria-label="开启或关闭环境声音">${ICONS.sound}</button>
      </div>
    </div>

    <div class="meditation-content">
      <div class="breath-visual" id="breathVisual" aria-hidden="true">
        <span class="breath-ring ring-one"></span>
        <span class="breath-ring ring-two"></span>
        <span class="breath-core"></span>
      </div>
      <p class="breath-label" id="breathLabel">自然呼吸</p>
      <p class="guidance-text" id="guidanceText" aria-live="polite">让身体被此刻稳稳承托。</p>
    </div>

    <div class="meditation-controls">
      <div class="progress-track" aria-hidden="true"><span id="progressBar"></span></div>
      <div class="timer-row">
        <span id="elapsedTime">00:00</span>
        <button class="pause-button" id="pauseButton" type="button">${ICONS.pause}<span>暂停</span></button>
        <span id="remainingTime">07:00</span>
      </div>
    </div>
  </section>

  <dialog class="app-dialog settings-dialog" id="settingsDialog">
    <div class="dialog-header">
      <div><p class="section-kicker">偏好设置</p><h2>让体验更贴近你</h2></div>
      <button class="icon-button dialog-close" type="button" aria-label="关闭设置">${ICONS.close}</button>
    </div>
    <div class="dialog-body settings-body">
      <section class="setting-section">
        <div class="setting-title">${ICONS.location}<div><strong>地球视角</strong><span>位置仅保存在当前设备，不会上传。</span></div></div>
        <div class="current-location-card"><span>当前</span><strong id="settingsLocationLabel">--</strong></div>
        <button class="secondary-button full-width" id="gpsButton" type="button">${ICONS.target}<span>使用设备位置</span></button>
        <label class="field-label" for="citySelect">或选择城市</label>
        <select id="citySelect" class="form-control"><option value="">选择一个城市…</option></select>
        <details class="manual-location">
          <summary>手动输入经纬度</summary>
          <div class="coordinate-grid">
            <label>纬度<input class="form-control" id="latitudeInput" type="number" min="-90" max="90" step="0.0001" /></label>
            <label>经度<input class="form-control" id="longitudeInput" type="number" min="-180" max="180" step="0.0001" /></label>
          </div>
          <button class="secondary-button full-width" id="applyCoordinatesButton" type="button">应用坐标</button>
        </details>
      </section>

      <section class="setting-section">
        <div class="setting-title">${ICONS.globe}<div><strong>星期三提醒</strong><span>网页打开或在后台可用时提醒；原生推送需后续封装。</span></div></div>
        <label class="setting-row"><span><strong>开启本地提醒</strong><small id="notificationStatus">尚未开启</small></span><input id="reminderToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
        <label class="time-setting"><span>提醒时间</span><input class="form-control" id="reminderTime" type="time" /></label>
      </section>

      <section class="setting-section">
        <label class="setting-row"><span><strong>语音引导</strong><small>使用设备自带的中文语音</small></span><input id="voiceToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
        <label class="setting-row"><span><strong>环境声音</strong><small>由浏览器实时生成，不加载音频文件</small></span><input id="ambientToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
        <label class="setting-row"><span><strong>减少动态效果</strong><small>缩短镜头运动并降低呼吸动画</small></span><input id="motionToggle" type="checkbox" class="switch-input" /><span class="switch" aria-hidden="true"></span></label>
      </section>

      <section class="setting-section credits-section">
        <strong>影像与内容说明</strong>
        <p>白天地表：NASA/Goddard Space Flight Center Scientific Visualization Studio；夜间灯光：NASA/GSFC 与 NOAA/NGDC。云层为艺术化效果。引导词为本项目原创，不代表任何作者、出版社或机构背书。</p>
      </section>

      <button class="danger-text-button" id="clearHistoryButton" type="button">清除本机练习记录</button>
    </div>
  </dialog>

  <dialog class="app-dialog history-dialog" id="historyDialog">
    <div class="dialog-header">
      <div><p class="section-kicker">练习记录</p><h2>你与地球相处的时刻</h2></div>
      <button class="icon-button dialog-close" type="button" aria-label="关闭记录">${ICONS.close}</button>
    </div>
    <div class="dialog-body">
      <div class="history-summary">
        <div><strong id="historyCount">0</strong><span>本周练习</span></div>
        <div><strong id="historyMinutes">0</strong><span>本周分钟</span></div>
      </div>
      <div class="history-list" id="historyList"></div>
    </div>
  </dialog>

  <dialog class="app-dialog mood-dialog" id="moodDialog">
    <div class="dialog-header compact">
      <div><p class="section-kicker">练习完成</p><h2>此刻，你有什么感受？</h2></div>
      <button class="icon-button dialog-close" type="button" aria-label="跳过记录感受">${ICONS.close}</button>
    </div>
    <div class="dialog-body">
      <p class="mood-note">没有“正确”的感受，选择最接近的一项即可。</p>
      <div class="mood-grid">
        <button type="button" data-mood="平静"><span>◌</span>平静</button>
        <button type="button" data-mood="温暖"><span>☼</span>温暖</button>
        <button type="button" data-mood="开阔"><span>∞</span>开阔</button>
        <button type="button" data-mood="沉重"><span>◐</span>沉重</button>
        <button type="button" data-mood="无明显变化"><span>—</span>无明显变化</button>
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
let settings: AppSettings = loadSettings();
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
const reminderToggle = query<HTMLInputElement>('#reminderToggle');
const reminderTime = query<HTMLInputElement>('#reminderTime');
const voiceToggle = query<HTMLInputElement>('#voiceToggle');
const ambientToggle = query<HTMLInputElement>('#ambientToggle');
const motionToggle = query<HTMLInputElement>('#motionToggle');
const notificationStatus = query<HTMLElement>('#notificationStatus');

for (const [index, preset] of LOCATION_PRESETS.entries()) {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = preset.name;
  citySelect.append(option);
}

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
  if (!('Notification' in window)) return '当前浏览器不支持系统通知，将使用应用内提醒';
  if (!window.isSecureContext) return '需通过 HTTPS 或本机服务器启用系统通知';
  if (Notification.permission === 'granted') return '系统通知已允许';
  if (Notification.permission === 'denied') return '系统通知已被浏览器阻止';
  return '开启后将请求通知权限';
}

function syncSettingsUi(): void {
  locationLabel.textContent = settings.locationLabel;
  settingsLocationLabel.textContent = `${settings.locationLabel} · ${coordinateLabel(settings.lat, settings.lon)}`;
  latitudeInput.value = settings.lat.toFixed(4);
  longitudeInput.value = settings.lon.toFixed(4);
  reminderToggle.checked = settings.reminderEnabled;
  reminderTime.value = settings.reminderTime;
  voiceToggle.checked = settings.voiceEnabled;
  ambientToggle.checked = settings.ambientEnabled;
  motionToggle.checked = settings.reduceMotion;
  notificationStatus.textContent = settings.reminderEnabled ? notificationStateText() : '尚未开启';

  const matchingIndex = LOCATION_PRESETS.findIndex(
    (preset) => Math.abs(preset.lat - settings.lat) < 0.001 && Math.abs(preset.lon - settings.lon) < 0.001
  );
  citySelect.value = matchingIndex >= 0 ? String(matchingIndex) : '';
}

function nextWednesdayText(now: Date): string {
  const today = now.getDay();
  const days = (3 - today + 7) % 7 || 7;
  if (days === 1) return '明天';
  return `${days} 天后`;
}

function updateClock(): void {
  const now = new Date();
  localTime.textContent = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(now);
  localTime.dateTime = now.toISOString();
  localDate.textContent = new Intl.DateTimeFormat('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long'
  }).format(now);
  timezoneLabel.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时间';

  const hour = now.getHours();
  const timePhrase = hour < 5 ? '夜色很深' : hour < 9 ? '新的一天正在展开' : hour < 12 ? '上午正在继续' : hour < 17 ? '白日缓缓流动' : hour < 20 ? '光线正在改变' : '夜晚已经到来';
  const state = earth.getDayState();
  const statePhrase = state === 'day'
    ? '你所在的位置此刻沐浴在日光中。'
    : state === 'night'
      ? '你所在的位置此刻位于地球的夜侧。'
      : '你所在的位置正接近晨昏交界。';
  nowLine.textContent = `${timePhrase}。${statePhrase}`;

  if (now.getDay() === 3) {
    weekdayTag.textContent = '星期三 · 地球和平观想';
    wednesdayCard.classList.add('is-today');
    wednesdayEyebrow.textContent = '今天是星期三';
    wednesdayTitle.textContent = '一起想象和平美好的地球';
    wednesdayBody.textContent = '从你所在的地方，向整颗星球送出善意。';
  } else {
    weekdayTag.textContent = '此刻 · 真实昼夜';
    wednesdayCard.classList.remove('is-today');
    wednesdayEyebrow.textContent = `${nextWednesdayText(now)} · 星期三`;
    wednesdayTitle.textContent = '地球和平观想';
    wednesdayBody.textContent = '为共同生活的地球，留下一段安静。';
  }
}

function updateStats(): void {
  const stats = getWeekStats();
  weekStats.textContent = stats.count ? `本周 ${stats.count} 次 · ${stats.minutes} 分钟` : '本周尚未练习';
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function checkWednesdayReminder(): void {
  if (!settings.reminderEnabled) return;
  const now = new Date();
  if (now.getDay() !== 3) return;
  const [hourText = '20', minuteText = '30'] = settings.reminderTime.split(':');
  const reminderMinutes = Number(hourText) * 60 + Number(minuteText);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const key = dateKey(now);
  if (currentMinutes < reminderMinutes || getLastReminderDate() === key) return;

  const title = '此刻地球 · 星期三';
  const body = '留 7 分钟，看一看我们共同生活的地球。';
  if ('Notification' in window && window.isSecureContext && Notification.permission === 'granted') {
    new Notification(title, { body, icon: './icons/icon-192.png', tag: 'earth-wednesday' });
  }
  showToast(`${title}：${body}`, 5000);
  setLastReminderDate(key);
}

async function useDeviceLocation(): Promise<void> {
  const buttons = [query<HTMLButtonElement>('#locationButton'), query<HTMLButtonElement>('#gpsButton')];
  if (!('geolocation' in navigator)) {
    showToast('当前浏览器不支持定位，请在设置中选择城市。');
    return;
  }
  if (!window.isSecureContext && location.protocol !== 'file:') {
    showToast('定位需要 HTTPS；你也可以直接选择城市。');
    return;
  }
  for (const button of buttons) button.disabled = true;
  showToast('正在获取大致位置…');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      settings = {
        ...settings,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        locationLabel: `我的位置 · ${coordinateLabel(position.coords.latitude, position.coords.longitude)}`,
        locationSource: 'gps'
      };
      saveAndApplySettings(true);
      for (const button of buttons) button.disabled = false;
      showToast('地球视角已回到你所在的位置。');
    },
    (error) => {
      for (const button of buttons) button.disabled = false;
      const message = error.code === error.PERMISSION_DENIED
        ? '定位权限未开启，请选择城市或在浏览器设置中允许定位。'
        : '暂时无法获取位置，请稍后重试或选择城市。';
      showToast(message, 4200);
    },
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 3_600_000 }
  );
}

query<HTMLButtonElement>('#locationButton').addEventListener('click', () => void useDeviceLocation());
query<HTMLButtonElement>('#gpsButton').addEventListener('click', () => void useDeviceLocation());
query<HTMLButtonElement>('#recenterButton').addEventListener('click', () => {
  earth.recenter();
  showToast('已回到你所在的位置。');
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
    locationLabel: preset.name,
    locationSource: 'preset'
  };
  saveAndApplySettings(true);
  showToast(`地球视角已切换到${preset.name}。`);
});

query<HTMLButtonElement>('#applyCoordinatesButton').addEventListener('click', () => {
  const lat = Number(latitudeInput.value);
  const lon = Number(longitudeInput.value);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    showToast('请输入有效的纬度（-90 至 90）和经度（-180 至 180）。', 4200);
    return;
  }
  settings = {
    ...settings,
    lat,
    lon,
    locationLabel: `手动位置 · ${coordinateLabel(lat, lon)}`,
    locationSource: 'manual'
  };
  saveAndApplySettings(true);
  showToast('手动位置已应用。');
});

reminderToggle.addEventListener('change', async () => {
  const enabled = reminderToggle.checked;
  settings.reminderEnabled = enabled;
  if (enabled && 'Notification' in window && window.isSecureContext && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') showToast('系统通知被阻止；应用打开时仍会显示星期三提醒。', 4200);
    else if (permission === 'granted') showToast('星期三提醒已开启。');
  } else if (enabled) {
    showToast('星期三应用内提醒已开启。');
  }
  saveAndApplySettings();
  checkWednesdayReminder();
});

reminderTime.addEventListener('change', () => {
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime.value)) {
    settings.reminderTime = reminderTime.value;
    saveAndApplySettings();
    showToast(`提醒时间已设为 ${reminderTime.value}。`);
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
  if (!window.confirm('清除当前设备上的全部练习记录？此操作无法撤销。')) return;
  clearSessions();
  updateStats();
  renderHistory();
  showToast('练习记录已清除。');
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
    empty.innerHTML = '<span>◯</span><strong>还没有练习记录</strong><p>完成一次观想后，它会安静地出现在这里。</p>';
    list.append(empty);
    return;
  }

  for (const session of sessions.slice(0, 30)) {
    const item = document.createElement('article');
    item.className = `history-item${session.completed ? '' : ' incomplete'}`;
    const date = new Date(session.startedAt);
    const title = document.createElement('div');
    title.className = 'history-item-title';
    const strong = document.createElement('strong');
    strong.textContent = `${session.durationMinutes} 分钟 · ${getMeditationPlan(session.durationMinutes).title}`;
    const status = document.createElement('span');
    status.textContent = session.completed ? (session.mood ?? '已完成') : '提前结束';
    title.append(strong, status);
    const meta = document.createElement('p');
    meta.textContent = new Intl.DateTimeFormat('zh-CN', {
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
  pauseButton.innerHTML = paused ? `${ICONS.play}<span>继续</span>` : `${ICONS.pause}<span>暂停</span>`;
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
      breathLabel.textContent = cue.breath ?? '自然呼吸';
      if (session.voiceEnabled && session.pausedAtMs === null) session.voice.speak(cue.text);
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
  const plan = getMeditationPlan(minutes);
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

  sessionDuration.textContent = `${plan.minutes} 分钟`;
  sessionTitle.textContent = plan.title;
  guidanceText.textContent = plan.cues[0]?.text ?? '让身体安顿下来。';
  breathLabel.textContent = plan.cues[0]?.breath ?? '自然呼吸';
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
      voice.speak(plan.cues[0]?.text ?? '让身体安顿下来。');
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
  document.title = '此刻地球 · 地球正念观想';
  updateStats();

  if (completed) {
    showToast(`今天，你与地球安静相处了 ${session.plan.minutes} 分钟。`, 4200);
    window.setTimeout(() => openDialog(moodDialog), 650);
  } else {
    showToast('练习已结束。即使只停留片刻，也是一种照料。', 3800);
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-minutes]')) {
  button.addEventListener('click', () => void startSession(Number(button.dataset.minutes)));
}
wednesdayCard.addEventListener('click', () => void startSession(7));

query<HTMLButtonElement>('#endSessionButton').addEventListener('click', () => {
  if (!activeSession) return;
  const elapsed = getSessionElapsedMs(activeSession) / 1000;
  if (elapsed > 15 && !window.confirm('现在结束本次练习吗？')) return;
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
    guidanceText.textContent = '练习已暂停。准备好时，轻触继续。';
    breathLabel.textContent = '暂停';
    earth.setMeditationPaused(true);
  } else {
    session.pausedTotalMs += performance.now() - session.pausedAtMs;
    session.pausedAtMs = null;
    session.ambient.setMuted(!session.soundEnabled);
    const cue = session.plan.cues[session.cueIndex];
    guidanceText.textContent = cue?.text ?? guidanceText.dataset.beforePause ?? '';
    breathLabel.textContent = cue?.breath ?? '自然呼吸';
    if (session.voiceEnabled && cue) session.voice.speak(cue.text);
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
    if (cue) session.voice.speak(cue.text);
  }
  updateSessionButtons();
});

for (const moodButton of document.querySelectorAll<HTMLButtonElement>('[data-mood]')) {
  moodButton.addEventListener('click', () => {
    const mood = moodButton.dataset.mood;
    if (pendingMoodRecordId && mood) updateSessionMood(pendingMoodRecordId, mood);
    pendingMoodRecordId = null;
    closeDialog(moodDialog);
    showToast(mood === '无明显变化' ? '感受已记录。没有变化，也完全可以。' : `已记录：${mood ?? ''}`);
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
  showToast('“此刻地球”已安装到你的设备。');
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
