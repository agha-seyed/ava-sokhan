
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
import { VOICES, RECITATION_STYLES, MUSIC_OPTIONS, POEM_EXAMPLES, ENV_EFFECTS } from './constants';
import { generateRecitation, interpretPoem, suggestOptimalConfig } from './services/geminiService';
import { mixAudio, bufferToWaveUrl } from './services/audioService';

const App: React.FC = () => {
  const [state, setState] = useState<RecitationState & {
    interpretation: string | null;
    isInterpreting: boolean;
    isAutoConfiguring: boolean;
  }>({
    text: '',
    style: RecitationStyle.POETIC,
    voice: VOICES[0].id,
    musicId: 'none',
    envEffectId: 'none',
    isGenerating: false,
    audioUrl: null,
    history: [],
    speed: 1.0,
    enhancedEffects: false,
    theme: 'default',
    interpretation: null,
    isInterpreting: false,
    isAutoConfiguring: false,
  });

  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

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

  // Audio Visualizer Setup
  useEffect(() => {
    if (state.audioUrl && audioRef.current && canvasRef.current) {
      const audio = audioRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;

      let source = (audio as any)._sourceNode;
      if (!source) {
        source = audioCtx.createMediaElementSource(audio);
        (audio as any)._sourceNode = source;
      }
      
      if (!analyserRef.current) {
        analyserRef.current = audioCtx.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioCtx.destination);
      }
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderFrame = () => {
        animationRef.current = requestAnimationFrame(renderFrame);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          
          const r = barHeight + 70;
          const g = 100;
          const b = 250;
          
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };
      
      audio.onplay = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        renderFrame();
      };
      
      audio.onpause = () => {
        cancelAnimationFrame(animationRef.current);
      };

      return () => {
        cancelAnimationFrame(animationRef.current);
      };
    }
  }, [state.audioUrl]);

  // Adjust playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.speed;
    }
  }, [state.speed, state.audioUrl]);

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
      const envEffect = ENV_EFFECTS.find(e => e.id === state.envEffectId);
      const finalBuffer = await mixAudio(voiceBuffer, music?.url || null, envEffect?.url || null, state.enhancedEffects);
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
    setState(prev => ({ ...prev, text, interpretation: null }));
  };

  const handleInterpret = async () => {
    if (!state.text.trim()) {
      setError('برای تفسیر، ابتدا شعر را وارد کنید.');
      return;
    }
    setState(prev => ({ ...prev, isInterpreting: true }));
    try {
      const res = await interpretPoem(state.text);
      setState(prev => ({ ...prev, interpretation: res, isInterpreting: false }));
    } catch (e) {
      setError('خطا در دریافت تفسیر.');
      setState(prev => ({ ...prev, isInterpreting: false }));
    }
  };

  const handleSmartAssistant = async () => {
    if (!state.text.trim()) {
      setError('برای استفاده از دستیار هوشمند، متن شعر را وارد کنید.');
      return;
    }
    setState(prev => ({ ...prev, isAutoConfiguring: true }));
    try {
      const config = await suggestOptimalConfig(state.text);
      setState(prev => ({ 
        ...prev, 
        style: config.style,
        voice: config.voice,
        musicId: config.musicId,
        isAutoConfiguring: false 
      }));
    } catch (e) {
      setError('خطا در عملکرد دستیار هوشمند.');
      setState(prev => ({ ...prev, isAutoConfiguring: false }));
    }
  };

  return (
    <div className={`min-h-screen pb-20 overflow-x-hidden transition-colors duration-1000 ${
      state.theme === 'smart' 
        ? state.style === RecitationStyle.ROMANTIC ? 'bg-[#2a0e1b]' // Red-ish
        : state.style === RecitationStyle.EPIC ? 'bg-[#1a0e08]'      // Orange-ish
        : state.style === RecitationStyle.CALM ? 'bg-[#0a1f1f]'      // Teal/Cyan
        : state.style === RecitationStyle.ANGRY ? 'bg-[#260505]'     // Dark red
        : state.style === RecitationStyle.PROTEST ? 'bg-[#1b1c21]'   // Dark grey
        : 'bg-[#0f172a]' // Default for Poetic
        : 'bg-[#0f172a]' // Default theme
    }`}>
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000 ${
          state.theme === 'smart' && state.style === RecitationStyle.ROMANTIC ? 'bg-pink-600/20'
          : state.theme === 'smart' && state.style === RecitationStyle.EPIC ? 'bg-orange-600/20'
          : 'bg-indigo-600/10'
        }`} />
        <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000 ${
           state.theme === 'smart' && state.style === RecitationStyle.CALM ? 'bg-cyan-600/20'
           : state.theme === 'smart' && state.style === RecitationStyle.PROTEST ? 'bg-zinc-600/20'
           : 'bg-purple-600/10'
        }`} />
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
                  <button 
                    onClick={() => {
                      const randomIdx = Math.floor(Math.random() * POEM_EXAMPLES.length);
                      loadExample(POEM_EXAMPLES[randomIdx].text);
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 font-bold"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    گالری اشعار تصادفی
                  </button>
                </div>
              </div>

              {state.isGenerating || state.audioUrl ? (
                 <div className="w-full h-96 overflow-y-auto bg-slate-900/40 rounded-xl p-6 text-center shadow-inner flex flex-col justify-center items-center">
                    {state.text.split('\n').map((line, i) => (
                      <p key={i} className="text-xl md:text-2xl font-bold leading-relaxed mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200" dir="rtl">{line}</p>
                    ))}
                    <p className="text-slate-500 text-sm mt-4">-- پیش‌نمایش زنده --</p>
                 </div>
              ) : (
                <textarea
                  value={state.text}
                  onChange={(e) => setState(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="اینجا بنویسید... مثلاً: ای پادشه خوبان، داد از غم تنهایی"
                  className="w-full h-96 bg-transparent border-none focus:ring-0 text-xl leading-[2.5rem] text-slate-200 placeholder:text-slate-600 resize-none dir-rtl"
                  dir="rtl"
                />
              )}

                <div className="mt-4 pt-6 border-t border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="bg-slate-800 px-2 py-1 rounded-md">{state.text.length} حرف</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleInterpret}
                    disabled={state.isInterpreting}
                    className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {state.isInterpreting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    تفسیر و معنی شعر
                  </button>
                  <button 
                    onClick={() => setState(prev => ({ ...prev, text: '', interpretation: null }))}
                    className="text-slate-500 hover:text-red-400 text-sm flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    پاکسازی
                  </button>
                </div>
              </div>
            </div>

            {/* Interpretation Card */}
            {state.interpretation && (
              <div className="glass p-6 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-slate-200">تفسیر و ابعاد پنهان شعر</h3>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {state.interpretation}
                </div>
              </div>
            )}

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
            <div className="glass p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 p-8 h-full bg-gradient-to-b from-purple-500 to-indigo-600 opacity-20" />
              
              {/* Smart Assistant Button */}
              <button
                onClick={handleSmartAssistant}
                disabled={state.isAutoConfiguring}
                className="w-full bg-slate-800/80 hover:bg-slate-700 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors text-indigo-300 font-bold mb-4"
              >
                {state.isAutoConfiguring ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
                دستیار جادویی انتخاب لحن و ملودی
              </button>

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
                  <div className="grid grid-cols-2 gap-3 mb-6">
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
                  
                  <label className="block text-slate-400 text-sm mb-3 pr-2 flex justify-between items-center">
                    <span>میکس افکت‌های محیطی</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ENV_EFFECTS.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setState(prev => ({ ...prev, envEffectId: e.id }))}
                        className={`p-3 rounded-2xl text-xs transition-all border flex items-center justify-center gap-2 ${
                          state.envEffectId === e.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2 pr-2">تنظیم دستی سرعت ({state.speed}x)</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      value={state.speed}
                      onChange={(e) => setState(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2 pr-2">افزایش افکت‌های صوتی</label>
                    <button 
                      onClick={() => setState(prev => ({ ...prev, enhancedEffects: !prev.enhancedEffects }))}
                      className={`w-full p-2.5 rounded-xl border text-sm transition-all ${
                        state.enhancedEffects 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {state.enhancedEffects ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>
                </section>
                
                <section className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2 pr-2">انتخاب تم</label>
                    <select
                      value={state.theme}
                      onChange={(e) => setState(prev => ({ ...prev, theme: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="default">پایه (پیش‌فرض)</option>
                      <option value="smart">تم هوشمند اشعار</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => { /* Placeholder for sync action */}}
                      className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-slate-200 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      همگام سازی
                    </button>
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
                
                <div className="flex flex-col w-full md:w-auto items-center md:items-end gap-2">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <audio 
                      ref={audioRef}
                      controls 
                      src={state.audioUrl} 
                      className="flex-1 accent-indigo-500" 
                      autoPlay
                      crossOrigin="anonymous"
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
                  <canvas ref={canvasRef} className="w-full h-12 rounded-lg opacity-80" width={400} height={48}></canvas>
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
        <p>توسعه یافته شده توسط تیم ویرانگران</p>
      </footer>
    </div>
  );
};

export default App;
