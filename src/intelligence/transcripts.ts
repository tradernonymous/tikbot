export type HookType =
  | 'CONTRARIAN'
  | 'QUESTION'
  | 'NEGATIVE_CONSTRAINT'
  | 'RESULT_STORY'
  | 'STANDARD';

export interface TranscriptAtom {
  type: 'HOOK' | 'CLAIM' | 'PROOF' | 'ACTION';
  text: string;
}

export interface TranscriptAnalysis {
  hookText: string;
  hookType: HookType;
  claims: string[];
  atoms: TranscriptAtom[];
  wordCount: number;
}

export function classifyHookType(sentence: string): HookType {
  const lower = sentence.toLowerCase().trim();

  if (
    lower.startsWith('stop ') ||
    lower.includes('nobody will tell you') ||
    lower.includes('the truth about') ||
    lower.includes('dirty secret')
  ) {
    return 'CONTRARIAN';
  }

  if (
    lower.endsWith('?') ||
    lower.startsWith('did you know') ||
    lower.startsWith('have you ever') ||
    lower.startsWith('what if') ||
    lower.startsWith('why do')
  ) {
    return 'QUESTION';
  }

  if (
    lower.startsWith('never ') ||
    lower.includes('avoid this') ||
    lower.includes('worst mistake') ||
    lower.includes("don't do this")
  ) {
    return 'NEGATIVE_CONSTRAINT';
  }

  if (
    lower.startsWith('how i ') ||
    lower.startsWith('from 0 to') ||
    lower.includes('in 30 days') ||
    lower.includes('in 24 hours')
  ) {
    return 'RESULT_STORY';
  }

  return 'STANDARD';
}

export function analyzeTranscript(text: string): TranscriptAnalysis {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const hookText = sentences[0] || '';
  const hookType = classifyHookType(hookText);

  const claims: string[] = [];
  const atoms: TranscriptAtom[] = [];

  if (hookText) {
    atoms.push({ type: 'HOOK', text: hookText });
  }

  for (let i = 1; i < sentences.length; i++) {
    const s = sentences[i];
    if (s.toLowerCase().includes('dictate') || s.toLowerCase().includes('because') || s.toLowerCase().includes('will')) {
      claims.push(s);
      atoms.push({ type: 'CLAIM', text: s });
    } else {
      atoms.push({ type: 'PROOF', text: s });
    }
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    hookText,
    hookType,
    claims,
    atoms,
    wordCount,
  };
}
