export interface VelocityCurveInput {
  totalTargetViews: number;
  durationHours: number;
  peakHourIndex?: number;
}

export interface VelocityCurveResult {
  hourlySlots: number[];
  totalAllocated: number;
}

export function generateVelocityCurve(input: VelocityCurveInput): VelocityCurveResult {
  const { totalTargetViews, durationHours } = input;
  const peak = input.peakHourIndex ?? Math.floor(durationHours / 2);

  // Generate bell-shaped relative weights
  const weights: number[] = [];
  let totalWeight = 0;

  for (let h = 0; h < durationHours; h++) {
    // Gaussian-like curve centered at peak
    const dist = Math.abs(h - peak);
    const weight = Math.exp(-0.5 * Math.pow(dist / (durationHours / 3.5), 2));
    weights.push(weight);
    totalWeight += weight;
  }

  // Allocate integer view counts based on normalized weights
  let allocated = 0;
  const slots: number[] = [];

  for (let h = 0; h < durationHours; h++) {
    const share = Math.round((weights[h] / totalWeight) * totalTargetViews);
    slots.push(share);
    allocated += share;
  }

  // Adjust rounding difference on peak hour slot
  const diff = totalTargetViews - allocated;
  slots[peak] += diff;

  return {
    hourlySlots: slots,
    totalAllocated: totalTargetViews,
  };
}
