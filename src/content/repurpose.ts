export interface SegmentOptions {
  maxDurationSeconds?: number;
  targetWpm?: number;
}

export interface ScriptClip {
  title: string;
  script: string;
  hasHook: boolean;
  estimatedDurationSeconds: number;
}

export function segmentVideoTranscript(
  transcript: string,
  options: SegmentOptions = {}
): ScriptClip[] {
  const maxDuration = options.maxDurationSeconds || 60;
  const wpm = options.targetWpm || 150; // standard speaking rate ~2.5 words per second
  const wordsPerSecond = wpm / 60;

  const sentences = transcript
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [];
  }

  const clips: ScriptClip[] = [];
  let currentSentences: string[] = [];
  let currentWords = 0;

  for (const s of sentences) {
    const sWords = s.split(/\s+/).filter(Boolean).length;
    const projectedDuration = (currentWords + sWords) / wordsPerSecond;

    if (projectedDuration > maxDuration && currentSentences.length > 0) {
      const scriptText = currentSentences.join(' ');
      clips.push({
        title: `Clip ${clips.length + 1}`,
        script: scriptText,
        hasHook: clips.length === 0 || /^(stop|did you know|never|how i)/i.test(currentSentences[0]),
        estimatedDurationSeconds: Math.round((currentWords / wordsPerSecond) * 10) / 10,
      });
      currentSentences = [s];
      currentWords = sWords;
    } else {
      currentSentences.push(s);
      currentWords += sWords;
    }
  }

  if (currentSentences.length > 0) {
    const scriptText = currentSentences.join(' ');
    clips.push({
      title: `Clip ${clips.length + 1}`,
      script: scriptText,
      hasHook: clips.length === 0 || /^(stop|did you know|never|how i)/i.test(currentSentences[0]),
      estimatedDurationSeconds: Math.round((currentWords / wordsPerSecond) * 10) / 10,
    });
  }

  return clips;
}

export interface SubtitleCue {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

function formatVttTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}

export function generateVttSubtitles(cues: SubtitleCue[]): string {
  let vtt = 'WEBVTT\n\n';

  cues.forEach((cue, index) => {
    vtt += `${index + 1}\n`;
    vtt += `${formatVttTimestamp(cue.startSeconds)} --> ${formatVttTimestamp(cue.endSeconds)}\n`;
    vtt += `${cue.text}\n\n`;
  });

  return vtt.trimEnd();
}
