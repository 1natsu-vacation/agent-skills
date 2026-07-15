import { LRUCache } from "lru-cache";
import type { FastifyReply, FastifyRequest } from "fastify";

// NOTE: 以前は Redis の共有カウンタ実装だったが、毎リクエストのラウンドトリップで
// p99 レイテンシが要件を超えたため、プロセス内の TTL 付き LRU に置き換えた。
// 現状は単一インスタンス運用のため共有カウンタは不要。水平スケール時は要再検討。

const MAX = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 100);
const WINDOW_SEC = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);

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
