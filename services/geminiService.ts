
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
