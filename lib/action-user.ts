import { AsyncLocalStorage } from "node:async_hooks";
import { getSession } from "./auth";

export const INTERNAL_ACTION_USER = Symbol("internal-action-user");
export type InternalActionUserToken = typeof INTERNAL_ACTION_USER;

type ActionUserContext = {
  userId: string;
};

const actionUserContext = new AsyncLocalStorage<ActionUserContext>();

export function trustActionUserId(userId: string) {
  actionUserContext.enterWith({ userId });
}

export async function requireSessionUserId() {
  const sessionUser = await getSession();
  if (!sessionUser?.id) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  return sessionUser.id;
}

export async function resolveActionUserId(
  explicitUserId?: string | null,
  token?: InternalActionUserToken,
) {
  const sessionUser = await getSession();
  const isInternalCall = token === INTERNAL_ACTION_USER;
  const trustedUserId = actionUserContext.getStore()?.userId ?? null;
  const currentUserId = sessionUser?.id ?? trustedUserId;

  if (!isInternalCall && currentUserId) {
    if (explicitUserId && explicitUserId !== currentUserId) {
      throw new Error("ไม่สามารถดำเนินการแทนผู้ใช้อื่นได้");
    }

    return currentUserId;
  }

  if (isInternalCall && explicitUserId) {
    return explicitUserId;
  }

  if (currentUserId) {
    return currentUserId;
  }

  throw new Error("กรุณาเข้าสู่ระบบ");
}
