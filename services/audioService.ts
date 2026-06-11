
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function mixAudio(voiceBuffer: AudioBuffer, musicUrl: string | null): Promise<AudioBuffer> {
  if (!musicUrl || musicUrl === '' || musicUrl === 'none') return voiceBuffer;

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const musicResponse = await fetch(musicUrl);
    if (!musicResponse.ok) throw new Error("Music fetch failed");
    
    const musicArrayBuffer = await musicResponse.arrayBuffer();
    const musicBuffer = await ctx.decodeAudioData(musicArrayBuffer);

    const length = voiceBuffer.length;
    const mixedBuffer = ctx.createBuffer(
      voiceBuffer.numberOfChannels,
      length,
      voiceBuffer.sampleRate
    );

    for (let channel = 0; channel < voiceBuffer.numberOfChannels; channel++) {
      const mixedData = mixedBuffer.getChannelData(channel);
      const voiceData = voiceBuffer.getChannelData(channel);
      
      // If music has fewer channels, fallback to 0
      const musicChannelIndex = channel < musicBuffer.numberOfChannels ? channel : 0;
      const musicData = musicBuffer.getChannelData(musicChannelIndex);

      for (let i = 0; i < length; i++) {
        // Loop the music if it's shorter than the voice
        const musicSample = musicData[i % musicBuffer.length];
        // Mix: 100% voice, 15% music for clarity
        mixedData[i] = voiceData[i] + (musicSample * 0.15);
      }
    }
    return mixedBuffer;
  } catch (error) {
    console.error("Failed to mix music, returning original voice:", error);
    return voiceBuffer;
  }
}

export function bufferToWaveUrl(buffer: AudioBuffer): string {
  const length = buffer.length * 2 + 44;
  const out = new Uint8Array(length);
  const view = new DataView(out.buffer);

  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + buffer.length * 2, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, buffer.length * 2, true);

  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  const blob = new Blob([out], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
