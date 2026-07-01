/** One shared AudioContext — browsers cap how many can exist. */
let context: AudioContext | null = null
function getContext(): AudioContext {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  context ??= new Ctor()
  return context
}

/**
 * Download and decode an audio file, returning `buckets` peak amplitudes in the
 * 0..1 range for drawing a waveform. Decoding needs the whole file, so callers
 * should size-cap before invoking this.
 */
export async function computeWaveform(
  url: string,
  buckets = 96,
): Promise<number[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`waveform failed: ${res.status}`)
  const audio = await getContext().decodeAudioData(await res.arrayBuffer())

  const data = audio.getChannelData(0)
  const block = Math.floor(data.length / buckets) || 1
  const peaks: number[] = []
  let max = 0

  for (let i = 0; i < buckets; i++) {
    let peak = 0
    const start = i * block
    for (let j = 0; j < block; j++) {
      const value = Math.abs(data[start + j] || 0)
      if (value > peak) peak = value
    }
    peaks.push(peak)
    if (peak > max) max = peak
  }

  return max > 0 ? peaks.map((p) => p / max) : peaks
}
