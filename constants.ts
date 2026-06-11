
import { RecitationStyle, VoiceOption, MusicOption } from './types';

export const VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'کوره (مردانه - عمیق)', gender: 'male' },
  { id: 'Puck', name: 'پاک (زنانه - لطیف)', gender: 'female' },
  { id: 'Charon', name: 'شارون (مردانه - جدی)', gender: 'male' },
  { id: 'Zephyr', name: 'زفیر (خنثی - مدرن)', gender: 'male' },
];

export const RECITATION_STYLES: { [key in RecitationStyle]: string } = {
  [RecitationStyle.POETIC]: 'با احساس لطیف و لحن ادبی سنتی قرائت کن.',
  [RecitationStyle.PROTEST]: 'با لحنی کوبنده، محکم و اعتراضی بخوان.',
  [RecitationStyle.ROMANTIC]: 'با لحنی بسیار عاشقانه، نرم و دلنشین دکلمه کن.',
  [RecitationStyle.CALM]: 'بسیار آرام، با طمأنینه و متین قرائت کن.',
  [RecitationStyle.ANGRY]: 'با لحنی خشمگین، پر از تنش و فریادگونه دکلمه کن.',
  [RecitationStyle.EPIC]: 'با لحنی حماسی، با شکوه و پرقدرت بخوان.',
};

export const MUSIC_OPTIONS: MusicOption[] = [
  { id: 'none', name: 'بدون موسیقی متن', url: '' },
  { id: 'piano', name: 'پیانو کلاسیک', url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d0c6ff1101.mp3' },
  { id: 'ambient', name: 'اتمسفریک آرام', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_3335552a42.mp3' },
  { id: 'ney', name: 'نوای نی (سنتی)', url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_9246a6f675.mp3' },
];

export const POEM_EXAMPLES = [
  {
    title: 'حافظ',
    text: 'الا یا ایها الساقی ادر کأسا و ناولها\nکه عشق آسان نمود اول ولی افتاد مشکل‌ها'
  },
  {
    title: 'مولانا',
    text: 'بشنو این نی چون شکایت می‌کند\nاز جدایی‌ها حکایت می‌کند'
  },
  {
    title: 'خیام',
    text: 'این کوزه گر دهر چنین جام لطیف\nمی‌سازد و باز بر زمین می‌زندش'
  }
];
