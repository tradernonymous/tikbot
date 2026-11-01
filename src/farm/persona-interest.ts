export interface PersonaInterestProfile {
  accountId: string;
  nicheKey: string;
  vocabulary: string[];
  topicWeights: Record<string, number>;
  sampleComments: string[];
}

export function enrichPersonaInterests(
  accountId: string,
  nicheKey: string,
  topics: string[]
): PersonaInterestProfile {
  const vocabulary = topics.map((t) => t.toLowerCase());
  const topicWeights: Record<string, number> = {};

  vocabulary.forEach((t, i) => {
    topicWeights[t] = 0.5 + (i * 0.1);
  });

  const sampleComments = [
    `This breakdown on ${vocabulary[0] || 'this'} is super helpful!`,
    `Never thought about ${vocabulary[1] || vocabulary[0] || 'it'} that way. Great insights!`,
    `What tool or setup did you use for this?`,
  ];

  return {
    accountId,
    nicheKey,
    vocabulary,
    topicWeights,
    sampleComments,
  };
}
