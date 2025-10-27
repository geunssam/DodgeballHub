// Web Audio API를 사용한 비프음 생성
const audioContext = typeof window !== 'undefined' ? new AudioContext() : null;

export function playBeep(frequency = 800, duration = 200) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  const volume = parseFloat(localStorage.getItem('dodgeball_volume') || '0.5');
  gainNode.gain.value = volume;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

export function playCountdownBeep() {
  playBeep(1000, 150);
}

export function playBallAdditionBeep() {
  playBeep(600, 300);
}

export function setVolume(value: number) {
  localStorage.setItem('dodgeball_volume', value.toString());
}

export function getVolume(): number {
  return parseFloat(localStorage.getItem('dodgeball_volume') || '0.5');
}
