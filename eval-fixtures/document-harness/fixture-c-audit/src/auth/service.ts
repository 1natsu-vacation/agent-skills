// 認証サービス。以前は src/services/AuthService.ts にあったが、auth 機能を
// src/auth/ 配下に集約するリファクタで移動した。
import jwt from "jsonwebtoken";
import { isRevoked } from "./revocationList.js";

export function verifyToken(token: string): { sub: string } | null {
  let payload: { sub: string; exp: number };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; exp: number };
  } catch {
    return null;
  }
  if (isRevoked(token)) return null;
  return { sub: payload.sub };
}
