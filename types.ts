
export enum RecitationStyle {
  POETIC = 'شاعرانه',
  PROTEST = 'اعتراضی',
  ROMANTIC = 'عاشقانه',
  CALM = 'آرام',
  ANGRY = 'عصبانی',
  EPIC = 'حماسی'
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

export interface MusicOption {
  id: string;
  name: string;
  url: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  style: RecitationStyle;
  voiceName: string;
  date: number;
  audioUrl: string;
}

export interface RecitationState {
  text: string;
  style: RecitationStyle;
  voice: string;
  musicId: string;
  isGenerating: boolean;
  audioUrl: string | null;
  history: HistoryItem[];
}
