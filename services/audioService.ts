
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

export async function mixAudio(voiceBuffer: AudioBuffer, musicUrl: string | null, envEffectUrl: string | null = null, enhancedEffects: boolean = false): Promise<AudioBuffer> {
  if ((!musicUrl || musicUrl === '' || musicUrl === 'none') && (!envEffectUrl || envEffectUrl === '' || envEffectUrl === 'none')) return voiceBuffer;

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    let musicBuffer: AudioBuffer | null = null;
    let envBuffer: AudioBuffer | null = null;

    if (musicUrl && musicUrl !== 'none') {
      const musicResponse = await fetch(musicUrl);
      if (musicResponse.ok) {
        const musicArrayBuffer = await musicResponse.arrayBuffer();
        musicBuffer = await ctx.decodeAudioData(musicArrayBuffer);
      }
    }

    if (envEffectUrl && envEffectUrl !== 'none') {
      const envResponse = await fetch(envEffectUrl);
      if (envResponse.ok) {
        const envArrayBuffer = await envResponse.arrayBuffer();
        envBuffer = await ctx.decodeAudioData(envArrayBuffer);
      }
    }

    const length = voiceBuffer.length;
    const mixedBuffer = ctx.createBuffer(
      voiceBuffer.numberOfChannels,
      length,
      voiceBuffer.sampleRate
    );

    for (let channel = 0; channel < voiceBuffer.numberOfChannels; channel++) {
      const mixedData = mixedBuffer.getChannelData(channel);
      const voiceData = voiceBuffer.getChannelData(channel);
      
      const musicData = musicBuffer ? musicBuffer.getChannelData(channel < musicBuffer.numberOfChannels ? channel : 0) : null;
      const envData = envBuffer ? envBuffer.getChannelData(channel < envBuffer.numberOfChannels ? channel : 0) : null;

      let voiceEnvelope = 0;
      let musicVolume = enhancedEffects ? 0.4 : 0.2;
      const volumeMultiplier = enhancedEffects ? 2.0 : 1.0;
      const baseEnvVolume = enhancedEffects ? 0.3 : 0.15;

      for (let i = 0; i < length; i++) {
        const musicSample = musicData ? musicData[i % musicBuffer!.length] : 0;
        const envSample = envData ? envData[i % envBuffer!.length] : 0;
        
        // Calculate voice envelope for Audio Ducking (Fast attack, slow release)
        const vSample = Math.abs(voiceData[i]);
        if (vSample > voiceEnvelope) {
          voiceEnvelope += (vSample - voiceEnvelope) * 0.01;
        } else {
          voiceEnvelope += (vSample - voiceEnvelope) * 0.0001; 
        }

        // Map envelope to music volume (Ducking)
        const targetVol = Math.max(0.05 * volumeMultiplier, (0.25 * volumeMultiplier) - (voiceEnvelope * 1.5));
        musicVolume += (targetVol - musicVolume) * 0.001; // Smooth volume transition

        // Add some basic pseudo-reverb or echo directly if enhanced is true
        let reverbSample = 0;
        if (enhancedEffects && i > 4800) { // ~200ms delay at 24000Hz
           reverbSample = voiceData[i - 4800] * 0.15;
        }

        mixedData[i] = voiceData[i] + reverbSample + (musicSample * musicVolume) + (envSample * baseEnvVolume);
      }
    }
    return mixedBuffer;
  } catch (error) {
    console.error("Failed to mix audio layers, returning original voice:", error);
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
