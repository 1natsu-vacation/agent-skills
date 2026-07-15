import { LRUCache } from "lru-cache";
import type { FastifyReply, FastifyRequest } from "fastify";

const MAX = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 100);
const WINDOW_SEC = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);

// クライアント(IP)ごとの呼び出し回数を、ウィンドウの長さだけ生かす TTL 付きで保持する。
const hits = new LRUCache<string, number>({
  max: 10_000,
  ttl: WINDOW_SEC * 1000,
});

export function rateLimit(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  const key = req.ip;
  const current = (hits.get(key) ?? 0) + 1;
  hits.set(key, current);

  if (current > MAX) {
    reply.code(429).send({ error: "rate_limit_exceeded" });
    return;
  }
  done();
}
