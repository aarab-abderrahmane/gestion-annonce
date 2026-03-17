type TimeoutOptions<T> = {
  label: string;
  timeoutMs?: number;
  fallback: T;
};

export async function withTimeout<T>({
  label,
  timeoutMs = 4000,
  fallback,
}: TimeoutOptions<T>, promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          console.error(`[supabase-timeout] ${label} exceeded ${timeoutMs}ms`);
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
