import NodeCache from "node-cache";

// レート制限カウンタなど、短命な数値をプロセス内に保持する薄いラッパー。
export class RateCache {
  private _cache: NodeCache;
  private _ttl: number;

  constructor(ttlSec: number) {
    this._ttl = ttlSec * 1000;
    this._cache = new NodeCache();
  }

  get(key: string): number | undefined {
    return this._cache.get(key);
  }

  set(key: string, value: number): void {
    this._cache.set(key, value, this._ttl);
  }
}
