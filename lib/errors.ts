const DEFAULT_ERROR_MESSAGE = 'حدث خطأ غير متوقع. يرجى إعادة المحاولة.';

export function getErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed || fallback;
  }

  if (error instanceof Error) {
    const trimmed = error.message.trim();
    return trimmed || fallback;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim();
    }

    if (typeof record.error_description === 'string' && record.error_description.trim()) {
      return record.error_description.trim();
    }

    if (typeof record.details === 'string' && record.details.trim()) {
      return record.details.trim();
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}' && serialized !== '[]') {
        return serialized;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function collectErrorMessages(errors: unknown[], fallback = DEFAULT_ERROR_MESSAGE) {
  const messages: string[] = [];
  const seen = new Set<string>();

  for (const error of errors) {
    if (error == null || error === false) continue;

    const message = getErrorMessage(error, fallback);
    if (!message || seen.has(message)) continue;

    seen.add(message);
    messages.push(message);
  }

  return messages;
}
