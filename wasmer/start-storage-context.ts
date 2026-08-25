type BrowserStartContext = Record<string, unknown>;

let currentContext: BrowserStartContext | undefined;

export async function runWithStartContext<T>(
  context: BrowserStartContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  const previousContext = currentContext;
  currentContext = context;

  try {
    return await fn();
  } finally {
    currentContext = previousContext;
  }
}

export function getStartContext<TThrow extends boolean = true>(opts?: {
  throwIfNotFound?: TThrow;
}): TThrow extends false ? BrowserStartContext | undefined : BrowserStartContext {
  if (!currentContext && opts?.throwIfNotFound !== false) {
    throw new Error("No Start context found in the browser runtime.");
  }

  return currentContext as TThrow extends false
    ? BrowserStartContext | undefined
    : BrowserStartContext;
}
