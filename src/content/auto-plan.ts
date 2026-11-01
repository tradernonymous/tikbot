export interface AutoPlanInput {
  trendSignals: {
    topic: string;
    risingScore: number;
    category?: string;
  }[];
  vocThemes?: {
    theme: string;
    frequency: number;
  }[];
  accountId: string;
  targetDaysAhead?: number;
}

export interface PlannedContentItem {
  id: string;
  title: string;
  topic: string;
  source: 'TREND_SIGNAL' | 'VOC_THEME' | 'HYBRID';
  fitScore: number;
  status: 'DRAFT' | 'APPROVED' | 'SCHEDULED' | 'REJECTED';
  suggestedHook: string;
  suggestedSlot: string;
  accountId: string;
}

export async function generateAutoContentPlan(
  input: AutoPlanInput
): Promise<PlannedContentItem[]> {
  const plans: PlannedContentItem[] = [];
  const daysAhead = input.targetDaysAhead || 3;
  let slotTimeOffset = 18 * 3600 * 1000; // 18:00 best time slot

  // Process trend signals
  input.trendSignals.forEach((trend, index) => {
    const targetDate = new Date(Date.now() + (index + 1) * 86400000 + slotTimeOffset);
    // Predicted fit score based on rising score
    const fitScore = Math.min(98, Math.max(70, Math.round(trend.risingScore * 0.95 + 4)));
    plans.push({
      id: `plan-trend-${Date.now()}-${index}`,
      title: trend.topic,
      topic: trend.topic,
      source: 'TREND_SIGNAL',
      fitScore,
      status: 'DRAFT',
      suggestedHook: `Stop scrolling if you care about ${trend.topic}.`,
      suggestedSlot: targetDate.toISOString(),
      accountId: input.accountId,
    });
  });

  // Process VOC themes
  (input.vocThemes || []).forEach((voc, index) => {
    const targetDate = new Date(Date.now() + (index + daysAhead) * 86400000 + slotTimeOffset);
    const fitScore = Math.min(95, Math.max(72, Math.round(75 + voc.frequency * 0.4)));
    plans.push({
      id: `plan-voc-${Date.now()}-${index}`,
      title: `Addressing VOC: ${voc.theme}`,
      topic: voc.theme,
      source: 'VOC_THEME',
      fitScore,
      status: 'DRAFT',
      suggestedHook: `The biggest question everyone asks: ${voc.theme}`,
      suggestedSlot: targetDate.toISOString(),
      accountId: input.accountId,
    });
  });

  return plans;
}

export function approveContentPlanItem(item: PlannedContentItem): PlannedContentItem {
  return {
    ...item,
    status: 'APPROVED',
  };
}
