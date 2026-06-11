
import { GoogleGenAI, Modality } from "@google/genai";
import { RecitationStyle } from "../types";
import { RECITATION_STYLES } from "../constants";
import { decodeBase64, decodeAudioData } from "./audioService";

export async function generateRecitation(
  text: string,
  style: RecitationStyle,
  voiceName: string
): Promise<AudioBuffer> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const instruction = RECITATION_STYLES[style];
  const prompt = `این شعر را با این ویژگی دکلمه کن: ${instruction}\n\nمتن شعر:\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from Gemini");
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBytes = decodeBase64(base64Audio);
  return await decodeAudioData(audioBytes, audioContext, 24000, 1);
}

export async function interpretPoem(text: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `این شعر فارسی را تفسیر کن، معنی ابیات را بگو و آرایه‌های ادبی مهم آن را استخراج کن. به زبان فارسی روان توضیح بده:\n\n${text}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
  });
  
  return response.text || "متاسفانه تفسیری یافت نشد.";
}

export async function suggestOptimalConfig(text: string): Promise<{ style: RecitationStyle, voice: string, musicId: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `Analyze this Persian poem:\n${text}\n\nReturn ONLY a JSON object with the best recommendations. Valid choices:\n- style: "شاعرانه", "اعتراضی", "عاشقانه", "آرام", "عصبانی", "حماسی"\n- voice: "Kore", "Puck", "Charon", "Zephyr"\n- musicId: "none", "piano", "ambient", "ney"\n\nJSON Output:`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
        responseMimeType: "application/json",
    }
  });
  
  try {
    const raw = response.text || "{}";
    const parsed = JSON.parse(raw);
    return {
        style: parsed.style || "شاعرانه",
        voice: parsed.voice || "Kore",
        musicId: parsed.musicId || "ambient"
    };
  } catch (e) {
    return { style: RecitationStyle.POETIC, voice: "Kore", musicId: "none" };
  }
}
