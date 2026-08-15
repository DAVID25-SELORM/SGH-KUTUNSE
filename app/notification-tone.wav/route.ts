const sampleRate = 22_050;
const durationSeconds = 0.36;

function notificationTone() {
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, 36 + sampleCount * 2, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, sampleCount * 2, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.sin(Math.PI * Math.min(1, time / durationSeconds)) ** 2;
    const frequency = time < 0.16 ? 659.25 : 783.99;
    const sample = Math.sin(2 * Math.PI * frequency * time) * envelope * 0.22;
    view.setInt16(44 + index * 2, Math.round(sample * 32_767), true);
  }
  return buffer;
}

export function GET() {
  return new Response(notificationTone(), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(44 + Math.floor(sampleRate * durationSeconds) * 2),
    },
  });
}
