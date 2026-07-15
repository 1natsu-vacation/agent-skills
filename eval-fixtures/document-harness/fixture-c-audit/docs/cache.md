# キャッシュ層

`src/cache.ts` の `RateCache` クラスがキャッシュを担当する。内部では `node-cache` ライブラリの `NodeCache` インスタンスを `this._cache` というフィールドに保持する。

公開メソッドは以下:

- `get(key: string): number | undefined` — `this._cache.get(key)` をそのまま返す
- `set(key: string, value: number): void` — `this._cache.set(key, value, this._ttl)` を呼ぶ
- `private _ttl: number` — コンストラクタで受け取った TTL（秒）を `* 1000` してミリ秒で保持する

`set` は内部で `this._cache.set` を呼んでおり、その第3引数に `this._ttl` を渡している。
