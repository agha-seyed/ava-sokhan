
import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Mic2, 
  Play, 
  Download, 
  RefreshCw, 
  Settings2, 
  FileText,
  Volume2,
  AlertCircle,
  History,
  Trash2,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { RecitationStyle, RecitationState, HistoryItem } from './types';
import { VOICES, RECITATION_STYLES, MUSIC_OPTIONS, POEM_EXAMPLES } from './constants';
import { generateRecitation } from './services/geminiService';
import { mixAudio, bufferToWaveUrl } from './services/audioService';

const App: React.FC = () => {
  const [state, setState] = useState<RecitationState>({
    text: '',
    style: RecitationStyle.POETIC,
    voice: VOICES[0].id,
    musicId: 'none',
    isGenerating: false,
    audioUrl: null,
    history: [],
  });

  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('avaye_sokhan_history');
    if (saved) {
      try {
        setState(prev => ({ ...prev, history: JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('avaye_sokhan_history', JSON.stringify(state.history.slice(0, 10)));
  }, [state.history]);

  const handleGenerate = async () => {
    if (!state.text.trim()) {
      setError('لطفا ابتدا متن شعر را وارد کنید.');
      return;
    }

    setError(null);
    setState(prev => ({ ...prev, isGenerating: true, audioUrl: null }));

    try {
      const voiceBuffer = await generateRecitation(state.text, state.style, state.voice);
      const music = MUSIC_OPTIONS.find(m => m.id === state.musicId);
      const finalBuffer = await mixAudio(voiceBuffer, music?.url || null);
      const url = bufferToWaveUrl(finalBuffer);
      
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: state.text.substring(0, 100),
        style: state.style,
        voiceName: VOICES.find(v => v.id === state.voice)?.name || 'نامشخص',
        date: Date.now(),
        audioUrl: url
      };

      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        audioUrl: url,
        history: [newHistoryItem, ...prev.history]
      }));
    } catch (err: any) {
      console.error(err);
      setError('خطا در ارتباط با هوش مصنوعی. احتمالا محدودیت درخواست یا مشکل اینترنت وجود دارد.');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const loadExample = (text: string) => {
    setState(prev => ({ ...prev, text }));
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[#0f172a]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-12">
        <header className="text-center mb-12 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-4 bg-slate-800/50 p-2 pr-6 rounded-full border border-slate-700 mb-6">
            <span className="text-indigo-400 font-bold tracking-widest text-xs">V2.0 AI RECITER</span>
            <div className="p-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-l from-indigo-300 via-purple-300 to-indigo-300">
            آوای سخن
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
            اشعار خود را به دکلمه‌هایی با احساس و شنیدنی تبدیل کنید. با قابلیت انتخاب لحن و موسیقی متن.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Editor Area */}
          <div className="lg:col-span-7 space-y-6 animate-in slide-in-from-right-8 duration-700">
            <div className="glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-indigo-500 to-purple-500 opacity-50" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <FileText className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">متن شعر شما</h2>
                </div>
                <div className="flex gap-2">
                  {POEM_EXAMPLES.map(ex => (
                    <button 
                      key={ex.title}
                      onClick={() => loadExample(ex.text)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
                    >
                      {ex.title}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={state.text}
                onChange={(e) => setState(prev => ({ ...prev, text: e.target.value }))}
                placeholder="اینجا بنویسید... مثلاً: ای پادشه خوبان، داد از غم تنهایی"
                className="w-full h-96 bg-transparent border-none focus:ring-0 text-xl leading-[2.5rem] text-slate-200 placeholder:text-slate-600 resize-none dir-rtl"
                dir="rtl"
              />

              <div className="mt-4 pt-6 border-t border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="bg-slate-800 px-2 py-1 rounded-md">{state.text.length} حرف</span>
                </div>
                <button 
                  onClick={() => setState(prev => ({ ...prev, text: '' }))}
                  className="text-slate-500 hover:text-red-400 text-sm flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  پاکسازی
                </button>
              </div>
            </div>

            {/* History Card */}
            {state.history.length > 0 && (
              <div className="glass p-6 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-slate-200">تاریخچه اخیر</h3>
                </div>
                <div className="space-y-3">
                  {state.history.slice(0, 3).map(item => (
                    <div key={item.id} className="bg-slate-800/40 p-3 rounded-xl flex items-center justify-between border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-300 line-clamp-1">{item.text}</span>
                        <span className="text-[10px] text-slate-500">{item.style} • {item.voiceName}</span>
                      </div>
                      <button 
                        onClick={() => setState(prev => ({ ...prev, audioUrl: item.audioUrl }))}
                        className="p-2 hover:bg-indigo-600/20 rounded-lg text-indigo-400 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Config Area */}
          <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-left-8 duration-700 delay-100">
            <div className="glass p-8 rounded-[2.5rem] space-y-8">
              {/* Styles */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Settings2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-slate-100">انتخاب سبک اجرا</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(RECITATION_STYLES).map((s) => (
                    <button
                      key={s}
                      onClick={() => setState(prev => ({ ...prev, style: s as RecitationStyle }))}
                      className={`py-3 rounded-2xl text-xs font-bold transition-all border ${
                        state.style === s 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              {/* Voices & Music */}
              <div className="grid grid-cols-1 gap-6">
                <section>
                  <label className="block text-slate-400 text-sm mb-3 pr-2">صدای گوینده</label>
                  <div className="relative">
                    <select
                      value={state.voice}
                      onChange={(e) => setState(prev => ({ ...prev, voice: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-slate-200 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <ChevronLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 -rotate-90" />
                  </div>
                </section>

                <section>
                  <label className="block text-slate-400 text-sm mb-3 pr-2 flex justify-between items-center">
                    <span>موسیقی پس‌زمینه</span>
                    {state.musicId !== 'none' && <Music className="w-3 h-3 animate-pulse text-indigo-400" />}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {MUSIC_OPTIONS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setState(prev => ({ ...prev, musicId: m.id }))}
                        className={`p-3 rounded-2xl text-xs transition-all border flex items-center justify-center gap-2 ${
                          state.musicId === m.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {m.id !== 'none' && <Music className="w-3 h-3" />}
                        {m.name}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Action */}
              <button
                onClick={handleGenerate}
                disabled={state.isGenerating}
                className={`w-full py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl overflow-hidden relative group ${
                  state.isGenerating 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white shadow-indigo-600/30'
                }`}
              >
                {state.isGenerating ? (
                  <>
                    <RefreshCw className="w-7 h-7 animate-spin" />
                    <span>درحال خلق اثر...</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                      <Mic2 className="w-6 h-6" />
                    </div>
                    <span>تولید دکلمه حرفه‌ای</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Floating Player */}
        {state.audioUrl && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 animate-in slide-in-from-bottom-12 duration-500">
            <div className="bg-slate-900/90 backdrop-blur-2xl border-2 border-indigo-500/50 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(79,70,229,0.3)]">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                    <Volume2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-slate-100 font-bold">دکلمه آماده شنیدن است</h4>
                    <p className="text-slate-500 text-xs">میکس شده با {MUSIC_OPTIONS.find(m => m.id === state.musicId)?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <audio 
                    ref={audioRef}
                    controls 
                    src={state.audioUrl} 
                    className="flex-1 accent-indigo-500" 
                    autoPlay
                  />
                  <a 
                    href={state.audioUrl} 
                    download="avaye-sokhan.wav"
                    className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg"
                    title="دانلود فایل"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 glass border-red-500/50 bg-red-500/20 p-4 px-6 rounded-2xl flex items-center gap-3 z-[60] animate-in bounce-in">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-100 text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500/50 hover:text-red-500 font-bold mr-4">×</button>
          </div>
        )}
      </div>

      <footer className="text-center mt-20 text-slate-600 text-sm pb-10">
        <p>توسعه یافته با هوش مصنوعی جمینای فلاش ۲.۵</p>
      </footer>
    </div>
  );
};

export default App;
