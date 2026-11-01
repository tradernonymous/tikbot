export type IncidentType =
  | 'CAPTCHA'
  | 'PHONE_REVERIFY'
  | 'LOGIN_CHALLENGE'
  | 'REACH_DROP';

export interface IncidentRecord {
  id?: string;
  accountId: string;
  proxyId?: string;
  type: IncidentType;
  details: string;
  timestamp?: string;
}

export interface IncidentLogResult {
  incidentId: string;
  proxyRetirementRecommended: boolean;
  proxyId?: string;
  incidentCountOnProxy: number;
}

export class IncidentLogManager {
  private maxIncidentsPerProxy: number;
  private logs: IncidentRecord[] = [];
  private proxyIncidentCount = new Map<string, number>();

  constructor(options: { maxIncidentsPerProxy?: number } = {}) {
    this.maxIncidentsPerProxy = options.maxIncidentsPerProxy ?? 3;
  }

  recordIncident(incident: IncidentRecord): IncidentLogResult {
    const record: IncidentRecord = {
      ...incident,
      id: incident.id || `inc-${Date.now()}-${this.logs.length}`,
      timestamp: incident.timestamp || new Date().toISOString(),
    };

    this.logs.push(record);

    let proxyRetirementRecommended = false;
    let incidentCount = 0;

    if (incident.proxyId) {
      incidentCount = (this.proxyIncidentCount.get(incident.proxyId) || 0) + 1;
      this.proxyIncidentCount.set(incident.proxyId, incidentCount);

      if (incidentCount >= this.maxIncidentsPerProxy) {
        proxyRetirementRecommended = true;
      }
    }

    return {
      incidentId: record.id!,
      proxyRetirementRecommended,
      proxyId: incident.proxyId,
      incidentCountOnProxy: incidentCount,
    };
  }

  getIncidentsForAccount(accountId: string): IncidentRecord[] {
    return this.logs.filter((l) => l.accountId === accountId);
  }

  getIncidentsForProxy(proxyId: string): IncidentRecord[] {
    return this.logs.filter((l) => l.proxyId === proxyId);
  }
}
