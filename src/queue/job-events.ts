import { EventEmitter } from 'events';
import { JobRecord } from './index';

export type JobEventType =
  | 'CONNECTED'
  | 'JOB_CREATED'
  | 'JOB_CLAIMED'
  | 'JOB_PROGRESS'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'JOB_CANCELLED';

export interface JobEvent {
  type: JobEventType;
  jobId?: string;
  name?: string;
  status?: string;
  progress?: number;
  message?: string;
  timestamp: string;
  job?: Partial<JobRecord>;
}

class JobEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitJobEvent(event: JobEvent): void {
    this.emit('job_event', event);
  }

  subscribe(listener: (event: JobEvent) => void): () => void {
    this.on('job_event', listener);
    return () => {
      this.off('job_event', listener);
    };
  }
}

export const globalJobEventBus = new JobEventBus();
