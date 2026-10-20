// Procedural Web Audio API sound effects for WNI Simulator (No external MP3 required)

class SoundManager {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * 1. Suara Kocok Dadu: Efek ketukan cepat saat dadu 3D berputar
   */
  public playDiceShake() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = now + i * 0.055;
      osc.frequency.setValueAtTime(
        210 + i * 55 + Math.random() * 70,
        startTime
      );
      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.05);
    }
  }

  /**
   * Suara langkah pion melompat petak demi petak
   */
  public playHop(stepIndex: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 320 + (stepIndex % 8) * 35;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * 2. Suara Gajian / Dapat Uang: Nada "Chime / Koin" ceria saat lewat START atau dapat uang
   */
  public playCashIn() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.11, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.18);
    });
  }

  /**
   * 3. Suara Bayar / Denda / Pajak: Nada turun saat uang berkurang
   */
  public playPenalty() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 246.94, 174.61].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.095);
      gain.gain.setValueAtTime(0.085, now + idx * 0.095);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.095 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.095);
      osc.stop(now + idx * 0.095 + 0.16);
    });
  }

  /**
   * 4. Suara Masuk Lapas / Musibah / Bekasi: Efek sirine pendek ("Wiu-wiu")
   */
  public playSiren() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    // 2 siklus "Wiu-Wiu" (520Hz -> 860Hz -> 500Hz -> 860Hz -> 480Hz)
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.14);
    osc.frequency.linearRampToValueAtTime(500, now + 0.28);
    osc.frequency.linearRampToValueAtTime(860, now + 0.42);
    osc.frequency.linearRampToValueAtTime(480, now + 0.56);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.setValueAtTime(0.09, now + 0.46);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.58);
  }

  /**
   * 5. Suara Beli / Upgrade Bangunan: Efek ketukan konstruksi singkat + nada naik
   */
  public playBuild() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 2 ketukan palu konstruksi singkat
    [0, 0.08].forEach((offset, idx) => {
      const tap = ctx.createOscillator();
      const tapGain = ctx.createGain();
      tap.type = 'square';
      tap.frequency.setValueAtTime(160 + idx * 60, now + offset);
      tap.frequency.exponentialRampToValueAtTime(80, now + offset + 0.05);
      tapGain.gain.setValueAtTime(0.11, now + offset);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.055);
      tap.connect(tapGain);
      tapGain.connect(ctx.destination);
      tap.start(now + offset);
      tap.stop(now + offset + 0.055);
    });

    // Nada konfirmasi bangunan selesai
    [440, 587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + 0.16 + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  public playCardReveal(isGood: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isGood
      ? [440, 554.37, 659.25, 880]
      : [392, 369.99, 349.23, 311.13];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isGood ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.09, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.22);
    });
  }
}

export const soundFX = new SoundManager();
