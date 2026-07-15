import Fastify from "fastify";
import { rateLimit } from "./middleware/rateLimit.js";

export function buildServer() {
  const app = Fastify({ logger: true });
  app.addHook("onRequest", rateLimit);
  // ... routes registered here
  return app;
}
