
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
    text: 'ای پادشه خوبان داد از غم تنهایی\nدل بی تو به جان آمد وقت است که بازآیی\nدایم گل این بستان شاداب نمی‌ماند\nدریاب ضعیفان را در وقت توانایی\nشب تاریک و بیم موج و گردابی چنین هایل\nکجا دانند حال ما سبکباران ساحل‌ها'
  },
  {
    title: 'مولانا',
    text: 'بشنو از نی چون حکایت می‌کند\nاز جدایی‌ها شکایت می‌کند\nکز نیستان تا مرا ببریده‌اند\nدر نفیرم مرد و زن نالیده‌اند\nسینه خواهم شرحه شرحه از فراق\nتا بگویم شرح درد اشتیاق'
  },
  {
    title: 'خیام',
    text: 'این کوزه‌گر دهر چنین جام لطیف\nمی‌سازد و باز بر زمین می‌زندش\nبر کوزه گری پریر کردم گذری\nاز خاک همی نمود هر دم هنری\nمن دیدم اگر ندید هر بی‌بصری\nخاک پدران بر کف هر کوزه گری'
  },
  {
    title: 'سعدی',
    text: 'بنی آدم اعضای یکدیگرند\nکه در آفرینش ز یک گوهرند\nچو عضوی به درد آورد روزگار\nدگر عضوها را نماند قرار\nتو کز محنت دیگران بی غمی\nنشاید که نامت نهند آدمی'
  },
  {
    title: 'شاملو',
    text: 'دهانت را می‌بویند\nمبادا که گفته باشی دوستت می‌دارم\nدلت را می‌بویند\nروزگارِ غریبی‌ست، نازنین\nو عشق را\nکنارِ تیرکِ راه‌بند\nتازیانه می‌زنند'
  },
  {
    title: 'سهراب',
    text: 'اهل کاشانم\nروزگارم بد نیست\nتکه نانی دارم خرده هوشی سر سوزن ذوقی\nمادری دارم بهتر از برگ درخت\nدوستانی بهتر از آب روان\nو خدایی که در این نزدیکی است'
  },
  {
    title: 'فروغ',
    text: 'من از نهایت شب حرف می‌زنم\nمن از نهایت تاریکی\nو از نهایت شب حرف می‌زنم\nاگر به خانه‌ی من آمدی برای من ای مهربان چراغ بیاور\nو یک دریچه که از آن\nبه ازدحام کوچه‌ی خوشبخت بنگرم'
  },
  {
    title: 'اخوان ثالث',
    text: 'سلامت را نمی‌خواهند پاسخ گفت\nسرها در گریبان است\nکسی سر بر نیارد کرد پاسخ گفتن و دیدار یاران را\nنگه جز پیش پا را دید، نتواند\nکه ره تاریک و لغزان است\nوگر دست محبت سوی کس یازی\nبه اکراه آورد دست از بغل بیرون\nکه سرما سخت سوزان است'
  }
];

export const ENV_EFFECTS = [
  { id: 'none', label: 'بدون افکت', icon: 'VolumeX' },
  { id: 'rain', label: 'صدای باران', url: 'https://cdn.pixabay.com/audio/2022/10/26/audio_985b4632db.mp3' },
  { id: 'fire', label: 'شومینه', url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_f5ebed1c90.mp3' },
  { id: 'nature', label: 'پرندگان', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8cedf38cb.mp3' }
];
