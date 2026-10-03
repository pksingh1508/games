// ZzFX ships without TypeScript types (Plan/gameStack.md §9.1).
declare module "zzfx" {
  export function zzfx(...parameters: Array<number | undefined>): AudioBufferSourceNode;
  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play(...parameters: Array<number | undefined>): AudioBufferSourceNode;
    playSamples(
      sampleChannels: number[][],
      volumeScale?: number,
      rate?: number,
      pan?: number,
      loop?: boolean,
    ): AudioBufferSourceNode;
    buildSamples(...parameters: Array<number | undefined>): number[];
    getNote(semitoneOffset?: number, rootNoteFrequency?: number): number;
  };
}
