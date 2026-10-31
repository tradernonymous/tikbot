export type CommentPersona = 'ENTHUSIAST' | 'INQUIRER' | 'CONVERTED_SKEPTIC' | 'SUPPORTER';

export interface GenerateCommentOptions {
  persona: CommentPersona;
  context?: string; // Optional keyword/topic like "hook editing" or "B2B SaaS"
}

const TEMPLATES: Record<CommentPersona, string[]> = {
  ENTHUSIAST: [
    'Honestly this is golden, saved for later!',
    'Wait this is actually genius... appreciate you sharing this!',
    'The breakdown in the second half blew my mind. 10/10.',
    'I needed to hear this today, thank you for breaking it down so clearly.',
  ],
  INQUIRER: [
    'Does this work if you have zero followers to start?',
    'How long did it take you to see real results with this?',
    'Curious if this strategy applies to {context} specifically?',
    'What is your take on doing this with organic vs paid?',
  ],
  CONVERTED_SKEPTIC: [
    'I used to think this was pure hype until I tested it last week.',
    'Thought this was clickbait at first but the retention logic actually checks out.',
    'Ngl I was skeptical, but this method fixed my drop-off problem.',
  ],
  SUPPORTER: [
    'Underrated advice right here 🔥',
    'Algorithm did its job recommending this to me today!',
    'Best breakdown on this topic so far, keep them coming.',
  ],
};

export function generateRelatableComment(options: GenerateCommentOptions): string {
  const list = TEMPLATES[options.persona] || TEMPLATES.ENTHUSIAST;
  const index = Math.floor(Math.random() * list.length);
  let template = list[index];

  if (options.context && template.includes('{context}')) {
    template = template.replace('{context}', options.context);
  } else if (options.context && options.persona === 'INQUIRER') {
    template = `Does this also apply to ${options.context}?`;
  }

  return template;
}
