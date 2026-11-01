export class LocalizationSpendApprovalRequiredError extends Error {
  constructor() {
    super(
      'Localization requires explicit operator confirmation before invoking external dub/translation APIs (spend guard).'
    );
    this.name = 'LocalizationSpendApprovalRequiredError';
  }
}

export interface LocalizationRequest {
  sourceVideoPath: string;
  sourceLanguage: string;
  targetLanguages: string[];
  dubAudio?: boolean;
  operatorConfirmed?: boolean;
}

export interface LocalizationTargetJob {
  id: string;
  targetLanguage: string;
  dubAudio: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface LocalizationBatchResult {
  batchId: string;
  status: 'QUEUED';
  jobs: LocalizationTargetJob[];
  requiresSpend: boolean;
  confirmedAt: string;
}

export class LocalizationPipeline {
  queueLocalizationJob(request: LocalizationRequest): LocalizationBatchResult {
    if (!request.operatorConfirmed) {
      throw new LocalizationSpendApprovalRequiredError();
    }

    const batchId = `loc-${Date.now()}`;
    const jobs: LocalizationTargetJob[] = request.targetLanguages.map((lang, idx) => ({
      id: `${batchId}-${lang}-${idx}`,
      targetLanguage: lang,
      dubAudio: Boolean(request.dubAudio),
      status: 'PENDING',
    }));

    return {
      batchId,
      status: 'QUEUED',
      jobs,
      requiresSpend: Boolean(request.dubAudio || request.targetLanguages.length > 0),
      confirmedAt: new Date().toISOString(),
    };
  }
}
