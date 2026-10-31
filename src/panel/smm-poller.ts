export interface SMMTaskToPoll {
  id: string;
  externalOrderId?: string;
}

export interface PollTaskResult {
  taskId: string;
  externalOrderId: string;
  success: boolean;
  rawStatus?: string;
  remains?: number;
  startCount?: number;
  error?: string;
}

export function calculatePollerBackoff(
  consecutiveErrors: number,
  baseDelayMs = 15000,
  maxDelayMs = 60000
): number {
  if (consecutiveErrors <= 0) return baseDelayMs;
  const factor = Math.pow(2, consecutiveErrors);
  return Math.min(baseDelayMs * factor, maxDelayMs);
}

export async function pollSingleSMMTask(
  task: SMMTaskToPoll,
  fetchFn: typeof fetch = fetch
): Promise<PollTaskResult> {
  const externalOrderId = task.externalOrderId || '';
  if (!externalOrderId) {
    return {
      taskId: task.id,
      externalOrderId: '',
      success: false,
      error: 'Missing externalOrderId',
    };
  }

  try {
    const res = await fetchFn('/api/v1/smm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        orderId: externalOrderId,
      }),
    });

    const data = await res.json();
    if (data?.success && data?.status) {
      const remains = data.status.remains !== undefined ? Number(data.status.remains) : undefined;
      const startCount = data.status.startCount !== undefined ? Number(data.status.startCount) : undefined;
      return {
        taskId: task.id,
        externalOrderId,
        success: true,
        rawStatus: data.status.status,
        remains,
        startCount,
      };
    }

    return {
      taskId: task.id,
      externalOrderId,
      success: false,
      error: data?.error || 'Provider returned unsuccessful status response',
    };
  } catch (err) {
    return {
      taskId: task.id,
      externalOrderId,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function pollAllSMMTasks(
  tasks: SMMTaskToPoll[],
  fetchFn: typeof fetch = fetch
): Promise<PollTaskResult[]> {
  const settled = await Promise.allSettled(
    tasks.map((task) => pollSingleSMMTask(task, fetchFn))
  );

  return settled.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      taskId: tasks[idx].id,
      externalOrderId: tasks[idx].externalOrderId || '',
      success: false,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}
