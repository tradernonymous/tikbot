export interface AbortableRequestManager {
  nextSignal: () => AbortSignal;
  abortCurrent: () => void;
}

export function createAbortableRequest(): AbortableRequestManager {
  let controller: AbortController | null = null;

  return {
    nextSignal: () => {
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      return controller.signal;
    },
    abortCurrent: () => {
      if (controller) {
        controller.abort();
        controller = null;
      }
    },
  };
}
