export type ActionIntent = 'success' | 'error' | 'info';

export type ActionMessage = {
  intent: ActionIntent;
  title: string;
  description?: string;
};

export type ToastVariant = 'default' | 'destructive';

export type ToastMessage = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

const intentToVariant: Record<ActionIntent, ToastVariant> = {
  success: 'default',
  error: 'destructive',
  info: 'default',
};

export function createActionMessage(
  intent: ActionIntent,
  title: string,
  description?: string,
): ActionMessage {
  return { intent, title, description };
}

export function actionMessageFromError(
  error: unknown,
  fallback = '요청 처리 중 오류가 발생했습니다.',
): ActionMessage {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || fallback);
    return createActionMessage('error', '오류 발생', message);
  }

  return createActionMessage('error', '오류 발생', fallback);
}

export function actionMessageFromSuccess(
  description: string,
  title = '처리가 완료되었습니다.',
): ActionMessage {
  return createActionMessage('success', title, description);
}

export function toToastMessage(message: ActionMessage): ToastMessage {
  return {
    title: message.title,
    description: message.description,
    variant: intentToVariant[message.intent],
  };
}
