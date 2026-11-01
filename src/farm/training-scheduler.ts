export interface CurriculumStats {
  curriculumKey: string;
  enrolledAccountsCount: number;
}

export class TrainingScheduler {
  private enrollments = new Map<string, string[]>(); // curriculumKey -> accountIds

  enrollAccount(accountId: string, curriculumKey: string): void {
    const list = this.enrollments.get(curriculumKey) || [];
    if (!list.includes(accountId)) {
      list.push(accountId);
      this.enrollments.set(curriculumKey, list);
    }
  }

  getCurriculumStats(curriculumKey: string): CurriculumStats {
    const list = this.enrollments.get(curriculumKey) || [];
    return {
      curriculumKey,
      enrolledAccountsCount: list.length,
    };
  }

  getEnrolledAccounts(curriculumKey: string): string[] {
    return this.enrollments.get(curriculumKey) || [];
  }
}
