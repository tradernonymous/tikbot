export interface GrowthDigestInput {
  timeframe: 'DAILY' | 'WEEKLY';
  newOutliers: { id: string; author: string; score: number }[];
  risingSounds: { id: string; title: string; velocity: number }[];
  trendMovers: { topic: string; changePercent: number }[];
  accountAnomalies: { accountId: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }[];
}

export interface GrowthDigest {
  id: string;
  timeframe: 'DAILY' | 'WEEKLY';
  generatedAt: string;
  summaryHeadline: string;
  sections: {
    outliersCount: number;
    topOutlier?: { author: string; score: number };
    risingSoundsCount: number;
    topSound?: { title: string; velocity: number };
    anomalyCount: number;
    highRiskAccounts: string[];
  };
  formattedMarkdown: string;
}

export function generateGrowthDigest(input: GrowthDigestInput): GrowthDigest {
  const sortedOutliers = [...input.newOutliers].sort((a, b) => b.score - a.score);
  const sortedSounds = [...input.risingSounds].sort((a, b) => b.velocity - a.velocity);
  const highRisk = input.accountAnomalies
    .filter((a) => a.severity === 'HIGH')
    .map((a) => a.accountId);

  const topOutlier = sortedOutliers[0];
  const topSound = sortedSounds[0];

  const headline = `${input.timeframe === 'DAILY' ? 'Daily' : 'Weekly'} Growth Digest: ${sortedOutliers.length} Outliers, ${sortedSounds.length} Rising Sounds`;

  let md = `# ${input.timeframe === 'DAILY' ? 'Daily' : 'Weekly'} Growth Digest\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n\n`;

  md += `## 🚀 Viral Outliers (${sortedOutliers.length})\n`;
  if (sortedOutliers.length === 0) {
    md += `_No new outliers detected in this window._\n\n`;
  } else {
    sortedOutliers.slice(0, 3).forEach((o) => {
      md += `- **@${o.author}**: ${o.score}x baseline engagement\n`;
    });
    md += `\n`;
  }

  md += `## 🎵 Rising Sounds (${sortedSounds.length})\n`;
  if (sortedSounds.length === 0) {
    md += `_No rising sounds crossed velocity thresholds._\n\n`;
  } else {
    sortedSounds.slice(0, 3).forEach((s) => {
      md += `- **${s.title}**: ${s.velocity} velocity score\n`;
    });
    md += `\n`;
  }

  md += `## ⚠️ Account Health & Anomalies (${input.accountAnomalies.length})\n`;
  if (input.accountAnomalies.length === 0) {
    md += `_All fleet accounts operational with nominal velocity._\n`;
  } else {
    input.accountAnomalies.forEach((a) => {
      md += `- **${a.accountId}**: ${a.type} [${a.severity}]\n`;
    });
  }

  return {
    id: `digest-${input.timeframe.toLowerCase()}-${Date.now()}`,
    timeframe: input.timeframe,
    generatedAt: new Date().toISOString(),
    summaryHeadline: headline,
    sections: {
      outliersCount: sortedOutliers.length,
      topOutlier,
      risingSoundsCount: sortedSounds.length,
      topSound,
      anomalyCount: input.accountAnomalies.length,
      highRiskAccounts: highRisk,
    },
    formattedMarkdown: md,
  };
}
