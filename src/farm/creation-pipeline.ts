export type CreationStage =
  | 'PERSONA_PROVISION'
  | 'PROXY_BIND'
  | 'EMAIL_REGISTER'
  | 'SIGNUP_FLOW'
  | 'PHONE_VERIFY'
  | 'PROFILE_SEED'
  | 'AGING';

export type TerminalFailureReason =
  | 'IP_FLAGGED'
  | 'CAPTCHA_TIMEOUT'
  | 'EMAIL_REJECTED'
  | 'PHONE_EXHAUSTED'
  | 'UNEXPECTED_ERROR';

export interface CreationJob {
  id: string;
  accountId: string;
  stage: CreationStage;
  proxyIp: string;
  attempts: number;
  maxAttempts: number;
  requiresPaidSms?: boolean;
  operatorConfirmedSpend?: boolean;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'WAITING_OPERATOR_APPROVAL' | 'DEAD_LETTER';
  completedAt?: string;
  failureReason?: TerminalFailureReason;
  errorDetails?: string;
}

export class AccountCreationPipeline {
  async processJob(job: CreationJob): Promise<CreationJob> {
    const updated = { ...job, status: 'RUNNING' as const };

    // Check stop-and-ask guardrail for phone verification spend
    if (
      job.stage === 'PHONE_VERIFY' &&
      job.requiresPaidSms &&
      !job.operatorConfirmedSpend
    ) {
      return {
        ...updated,
        status: 'WAITING_OPERATOR_APPROVAL',
        errorDetails: 'Paid SMS verification requires explicit operator approval before proceeding.',
      };
    }

    // Automatically transition through standard staged queue
    return {
      ...updated,
      stage: 'AGING',
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    };
  }

  async failJob(
    job: CreationJob,
    reason: TerminalFailureReason,
    details: string
  ): Promise<CreationJob> {
    return {
      ...job,
      status: 'DEAD_LETTER',
      failureReason: reason,
      errorDetails: details,
    };
  }
}
