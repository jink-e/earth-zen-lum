import type { AppLanguage } from './storage';

export interface MeditationCue {
  at: number;
  text: string;
  breath?: string;
}

export interface MeditationPlan {
  minutes: number;
  title: string;
  subtitle: string;
  cues: MeditationCue[];
}

export const MEDITATION_PLANS: Record<number, MeditationPlan> = {
  3: {
    minutes: 3,
    title: '回到此刻',
    subtitle: '从身体出发，看见此刻的地球',
    cues: [
      { at: 0, text: '让身体被座椅、床铺或地面稳稳承托。', breath: '自然呼吸' },
      { at: 0.09, text: '不需要改变呼吸，只是知道：你正在呼吸。', breath: '吸气 · 呼气' },
      { at: 0.2, text: '感受脚下的地面，也感受地面之下广阔的地球。', breath: '感受承托' },
      { at: 0.34, text: '想象视角从你所在的地方，安静地向上、向远处移动。', breath: '缓缓拉远' },
      { at: 0.49, text: '看见海洋、陆地、云层，以及正在移动的昼夜交界。', breath: '看见整体' },
      { at: 0.64, text: '不需要让世界变得完美，只允许这一刻的地球被完整地看见。', breath: '无需改变' },
      { at: 0.78, text: '愿我安宁。愿他人安宁。愿所有生命被善意相待。', breath: '送出善意' },
      { at: 0.91, text: '把这一点开阔带回身体，带回今天可以完成的一件小事。', breath: '慢慢回来' },
      { at: 0.98, text: '轻轻活动手指。准备好时，睁开眼睛。', breath: '回到此刻' }
    ]
  },
  7: {
    minutes: 7,
    title: '拥抱地球',
    subtitle: '一段完整的地球正念观想',
    cues: [
      { at: 0, text: '先找到一个不必用力维持的姿势。让肩膀松下来。', breath: '安顿身体' },
      { at: 0.055, text: '觉察一次吸气，也觉察一次呼气。无需把呼吸变深。', breath: '自然呼吸' },
      { at: 0.12, text: '感受身体与地面的接触。此刻，你正坐在地球上的一个地方。', breath: '感受承托' },
      { at: 0.2, text: '在心里看见你所在的房间、街道与城市。无需看得清楚。', breath: '看见附近' },
      { at: 0.29, text: '视角继续拉远。熟悉的边界渐渐变小，海洋与陆地进入视野。', breath: '缓缓拉远' },
      { at: 0.38, text: '看见此刻的白昼，也看见另一侧的夜晚。它们同时存在。', breath: '容纳明暗' },
      { at: 0.47, text: '想到那些正在醒来的人，也想到正在休息的人。', breath: '想到他人' },
      { at: 0.56, text: '想到河流、森林、动物，以及不被你看见的无数生命。', breath: '扩大关怀' },
      { at: 0.65, text: '世界并不完美。你不需要否认困难，也不需要独自承担一切。', breath: '允许真实' },
      { at: 0.74, text: '在心里轻轻说：愿我得到安宁与理解。', breath: '愿我安宁' },
      { at: 0.81, text: '愿我所爱的人，以及与我不同的人，都得到安宁与理解。', breath: '愿他人安宁' },
      { at: 0.88, text: '愿这颗星球上的生命，少一些伤害，多一些照料。', breath: '愿地球安宁' },
      { at: 0.94, text: '让视角慢慢回到你所在的地方。感受身体仍在这里。', breath: '慢慢回来' },
      { at: 0.985, text: '带着一小点安静，回到今天。', breath: '回到此刻' }
    ]
  },
  12: {
    minutes: 12,
    title: '和平观想',
    subtitle: '从个人安宁扩展到共同家园',
    cues: [
      { at: 0, text: '让身体安顿下来。允许这一小段时间，不用于解决问题。', breath: '安顿身体' },
      { at: 0.045, text: '觉察呼吸最容易被感知的地方：鼻尖、胸口，或腹部。', breath: '觉察呼吸' },
      { at: 0.1, text: '吸气时，知道自己在吸气。呼气时，知道自己在呼气。', breath: '吸气 · 呼气' },
      { at: 0.16, text: '感受身体的重量被大地承托。你不必悬浮，也不必独自支撑。', breath: '感受承托' },
      { at: 0.22, text: '想象你所在的位置出现一个温和的光点，只用来提醒：你在这里。', breath: '我在这里' },
      { at: 0.29, text: '视角缓缓上升。看见附近的屋顶、道路、山川或海岸。', breath: '看见附近' },
      { at: 0.36, text: '继续拉远，直到整颗地球进入视野。让它保持真实，而不是完美。', breath: '看见整体' },
      { at: 0.43, text: '看见白昼与夜晚相接。光与暗没有争夺，它们只是轮流经过。', breath: '容纳明暗' },
      { at: 0.5, text: '想到此刻与你同处白昼的人。有人忙碌，有人欢喜，也有人承受困难。', breath: '看见白昼' },
      { at: 0.57, text: '想到此刻身处夜晚的人。有人熟睡，有人工作，也有人无法入眠。', breath: '看见夜晚' },
      { at: 0.64, text: '想到与你语言、信念和生活方式不同的人。差异也存在于同一个家园。', breath: '容纳差异' },
      { at: 0.7, text: '想到森林、海洋、土壤、昆虫与动物。人类并不是地球唯一的居民。', breath: '关怀生命' },
      { at: 0.76, text: '先把善意带给自己：愿我安全，愿我被理解，愿我有力量照料当下。', breath: '愿我安宁' },
      { at: 0.82, text: '再把善意带给亲近的人：愿他们安全，愿他们被理解。', breath: '愿亲友安宁' },
      { at: 0.87, text: '也把善意带给陌生人，甚至带给与你意见不同的人。', breath: '愿众人安宁' },
      { at: 0.92, text: '愿冲突减少一点，愿倾听增加一点，愿脆弱的生命得到照料。', breath: '愿和平增长' },
      { at: 0.96, text: '你不需要承担整个世界。选择今天能够完成的一件小小善举。', breath: '回到行动' },
      { at: 0.988, text: '感受呼吸与身体。准备好时，睁开眼睛，回到此刻。', breath: '慢慢回来' }
    ]
  }
};

export const ENGLISH_MEDITATION_PLANS: Record<number, MeditationPlan> = {
  3: {
    minutes: 3,
    title: 'Return to now',
    subtitle: 'Begin with the body and notice Earth now',
    cues: [
      { at: 0, text: 'Let the chair, bed, or ground steadily support your body.', breath: 'Natural breath' },
      { at: 0.09, text: 'There is no need to change the breath. Simply know that you are breathing.', breath: 'Inhale · exhale' },
      { at: 0.2, text: 'Feel the ground beneath you, and the wide Earth beneath the ground.', breath: 'Feel support' },
      { at: 0.34, text: 'Imagine the view moving quietly upward and farther away from where you are.', breath: 'Slowly widen' },
      { at: 0.49, text: 'See ocean, land, cloud, and the moving line between day and night.', breath: 'See the whole' },
      { at: 0.64, text: 'The world does not need to be perfect. Let this moment of Earth be seen as it is.', breath: 'No need to fix' },
      { at: 0.78, text: 'May I be peaceful. May others be peaceful. May all life be met with care.', breath: 'Send goodwill' },
      { at: 0.91, text: 'Bring a little of this spaciousness back to the body, and to one small thing you can do today.', breath: 'Return slowly' },
      { at: 0.98, text: 'Gently move the fingers. When you are ready, open your eyes.', breath: 'Back to now' }
    ]
  },
  7: {
    minutes: 7,
    title: 'Embrace Earth',
    subtitle: 'A full Earth mindfulness practice',
    cues: [
      { at: 0, text: 'Find a posture that does not need effort to hold. Let the shoulders soften.', breath: 'Settle the body' },
      { at: 0.055, text: 'Notice one inhale and one exhale. There is no need to deepen the breath.', breath: 'Natural breath' },
      { at: 0.12, text: 'Feel the contact between body and ground. Right now, you are sitting somewhere on Earth.', breath: 'Feel support' },
      { at: 0.2, text: 'In the mind, see your room, your street, and your city. It does not need to be clear.', breath: 'See nearby' },
      { at: 0.29, text: 'The view continues to widen. Familiar boundaries become smaller as oceans and land come into view.', breath: 'Slowly widen' },
      { at: 0.38, text: 'See daylight here and night elsewhere. They exist at the same time.', breath: 'Hold light and dark' },
      { at: 0.47, text: 'Think of people waking up, and people resting.', breath: 'Remember others' },
      { at: 0.56, text: 'Think of rivers, forests, animals, and countless lives you do not see.', breath: 'Widen care' },
      { at: 0.65, text: 'The world is not perfect. You do not have to deny difficulty or carry it alone.', breath: 'Allow what is true' },
      { at: 0.74, text: 'Quietly say: may I have peace and understanding.', breath: 'May I be peaceful' },
      { at: 0.81, text: 'May the people I love, and people different from me, have peace and understanding.', breath: 'May others be peaceful' },
      { at: 0.88, text: 'May life on this planet have less harm and more care.', breath: 'May Earth be peaceful' },
      { at: 0.94, text: 'Let the view slowly return to where you are. Feel the body still here.', breath: 'Return slowly' },
      { at: 0.985, text: 'Carry a small quietness back into today.', breath: 'Back to now' }
    ]
  },
  12: {
    minutes: 12,
    title: 'Peace practice',
    subtitle: 'From personal steadiness to our shared home',
    cues: [
      { at: 0, text: 'Let the body settle. Allow this time to be free from solving anything.', breath: 'Settle the body' },
      { at: 0.045, text: 'Notice where the breath is easiest to feel: the nose, chest, or belly.', breath: 'Notice breath' },
      { at: 0.1, text: 'As you inhale, know that you are inhaling. As you exhale, know that you are exhaling.', breath: 'Inhale · exhale' },
      { at: 0.16, text: 'Feel the body’s weight held by the Earth. You do not need to float or hold yourself alone.', breath: 'Feel support' },
      { at: 0.22, text: 'Imagine a gentle point of light where you are, only to remind you: you are here.', breath: 'I am here' },
      { at: 0.29, text: 'The view rises slowly. See nearby roofs, roads, mountains, or coastlines.', breath: 'See nearby' },
      { at: 0.36, text: 'Continue widening until the whole Earth is in view. Let it be real, not perfect.', breath: 'See the whole' },
      { at: 0.43, text: 'See daylight meeting night. Light and dark do not fight; they take turns passing through.', breath: 'Hold light and dark' },
      { at: 0.5, text: 'Think of people sharing daylight with you: some busy, some joyful, some carrying difficulty.', breath: 'See daylight' },
      { at: 0.57, text: 'Think of people in night: some sleeping, some working, some unable to rest.', breath: 'See night' },
      { at: 0.64, text: 'Think of people with different languages, beliefs, and ways of living. Difference also belongs to one home.', breath: 'Hold difference' },
      { at: 0.7, text: 'Think of forests, oceans, soil, insects, and animals. Humans are not Earth’s only residents.', breath: 'Care for life' },
      { at: 0.76, text: 'Bring goodwill first to yourself: may I be safe, understood, and able to care for this moment.', breath: 'May I be peaceful' },
      { at: 0.82, text: 'Bring goodwill to those close to you: may they be safe and understood.', breath: 'May loved ones be peaceful' },
      { at: 0.87, text: 'Bring goodwill to strangers, and even to people who disagree with you.', breath: 'May all be peaceful' },
      { at: 0.92, text: 'May conflict lessen a little. May listening grow a little. May vulnerable life be cared for.', breath: 'May peace grow' },
      { at: 0.96, text: 'You do not need to carry the whole world. Choose one small act of care for today.', breath: 'Return to action' },
      { at: 0.988, text: 'Feel the breath and the body. When you are ready, open your eyes and return to now.', breath: 'Return slowly' }
    ]
  }
};

const PLANS_BY_LANGUAGE: Record<AppLanguage, Record<number, MeditationPlan>> = {
  zh: MEDITATION_PLANS,
  en: ENGLISH_MEDITATION_PLANS
};

export function getMeditationPlan(minutes: number, language: AppLanguage = 'zh'): MeditationPlan {
  const plans = PLANS_BY_LANGUAGE[language] ?? MEDITATION_PLANS;
  return plans[minutes] ?? plans[7]!;
}

export class AmbientSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private oscillators: OscillatorNode[] = [];

  async start(): Promise<void> {
    if (this.context) return;
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    if (context.state === 'suspended') {
      try {
        await Promise.race([
          context.resume(),
          new Promise<void>((resolve) => window.setTimeout(resolve, 300))
        ]);
      } catch {
        // The timer and text guidance continue even when autoplay policy keeps audio suspended.
      }
    }
    const master = context.createGain();
    master.gain.value = 0.0001;
    master.connect(context.destination);

    const seconds = 4;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[index] = last * 2.5;
    }

    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 520;
    lowpass.Q.value = 0.35;
    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.16;
    noise.connect(lowpass).connect(noiseGain).connect(master);
    noise.start();

    const oscillators: OscillatorNode[] = [];
    for (const [frequency, volume] of [[109.9, 0.022], [164.8, 0.009], [219.8, 0.006]] as const) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain).connect(master);
      oscillator.start();
      oscillators.push(oscillator);
    }

    this.context = context;
    this.master = master;
    this.noiseSource = noise;
    this.oscillators = oscillators;
    master.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 2.2);
  }

  async chime(): Promise<void> {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    const now = context.currentTime;
    for (const [frequency, offset, volume] of [[523.25, 0, 0.055], [659.25, 0.07, 0.035], [783.99, 0.14, 0.025]] as const) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(volume, now + offset + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 2.8);
      oscillator.connect(gain).connect(master);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 3);
    }
  }

  setMuted(muted: boolean): void {
    if (!this.context || !this.master) return;
    const value = muted ? 0.0001 : 0.12;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.exponentialRampToValueAtTime(value, this.context.currentTime + 0.35);
  }

  stop(): void {
    if (!this.context || !this.master) return;
    const context = this.context;
    const master = this.master;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.1);
    window.setTimeout(() => {
      try { this.noiseSource?.stop(); } catch { /* already stopped */ }
      for (const oscillator of this.oscillators) {
        try { oscillator.stop(); } catch { /* already stopped */ }
      }
      void context.close();
    }, 1250);
    this.context = null;
    this.master = null;
    this.noiseSource = null;
    this.oscillators = [];
  }
}

export class GuidanceVoice {
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  speak(text: string, language: AppLanguage = 'zh'): void {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    this.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'zh-CN';
    utterance.rate = language === 'en' ? 0.84 : 0.78;
    utterance.pitch = language === 'en' ? 0.96 : 0.92;
    utterance.volume = 0.82;
    const voices = window.speechSynthesis.getVoices();
    const preferred = language === 'en'
      ? voices.find((voice) => /en-US|English|Samantha|Alex/i.test(`${voice.lang} ${voice.name}`))
        ?? voices.find((voice) => /^en/i.test(voice.lang))
      : voices.find((voice) => /zh-CN|普通话|Mandarin/i.test(`${voice.lang} ${voice.name}`))
        ?? voices.find((voice) => /^zh/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}
