// In-memory per-chat state for multi-step flows (add product, add category, etc.)

export type FlowName =
  | 'add_category'
  | 'add_product'
  | 'edit_product_field'   // data.productId, data.field
  | 'search_products';

export interface Session {
  flow?: FlowName;
  step?: number;
  data?: Record<string, any>;
}

const sessions = new Map<number, Session>();

export function getSession(chatId: number): Session {
  let s = sessions.get(chatId);
  if (!s) {
    s = {};
    sessions.set(chatId, s);
  }
  return s;
}

export function setFlow(chatId: number, flow: FlowName, data: Record<string, any> = {}) {
  sessions.set(chatId, { flow, step: 0, data });
}

export function updateSession(chatId: number, patch: Partial<Session>) {
  const s = getSession(chatId);
  const { data: patchData, ...rest } = patch;
  Object.assign(s, rest);
  if (patchData) s.data = { ...(s.data || {}), ...patchData };
  sessions.set(chatId, s);
}

export function clearSession(chatId: number) {
  sessions.delete(chatId);
}
