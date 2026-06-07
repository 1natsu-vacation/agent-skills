// check.mjs のテスト（Node 組み込みテストランナー / 依存ゼロ）。
//
//   node --test .claude/skills/spec-drift-watch/scripts/
//
// ネットワークには出ない。fetchDoc は注入した fetchImpl でモックし、unifiedDiff は
// git とテンポラリファイルのみで検証する（実 fetch・実上流アクセスはしない）。

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  normalize,
  countChanges,
  findDuplicateId,
  extractIndexUrls,
  stripDiffHeaders,
  unifiedDiff,
  findSpecWatchDir,
  fetchDoc,
} from "./check.mjs";

// テスト用の使い捨て tmp ディレクトリ
function tmp(prefix = "spec-drift-test-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

test("normalize: 末尾に改行を1つ付け、末尾空白/空行を畳む", () => {
  assert.equal(normalize("a"), "a\n");
  assert.equal(normalize("a\n\n\n"), "a\n");
  assert.equal(normalize("a   \n  "), "a\n");
});

test("normalize: CRLF と単独 CR を LF に統一する", () => {
  assert.equal(normalize("a\r\nb"), "a\nb\n");
  assert.equal(normalize("a\rb"), "a\nb\n");
  assert.equal(normalize("a\r\nb\rc\n"), "a\nb\nc\n");
});

test("normalize: 先頭 BOM を除去する", () => {
  assert.equal(normalize("﻿# title\n"), "# title\n");
  // 行中の改行は保持（行内差分はマスクしない）
  assert.equal(normalize("﻿a\nb\n"), "a\nb\n");
});

test("normalize: 空文字でも改行1つを返す", () => {
  assert.equal(normalize(""), "\n");
});

test("countChanges: 追加/削除行を数え、+++/--- ヘッダは除外する", () => {
  const diff = ["--- a/x", "+++ b/x", "@@ -1 +1 @@", "-old", "+new", " ctx"].join("\n");
  assert.deepEqual(countChanges(diff), { add: 1, del: 1 });
});

test("findDuplicateId: 重複があれば最初の id、なければ undefined", () => {
  assert.equal(findDuplicateId([{ id: "a" }, { id: "b" }, { id: "a" }]), "a");
  assert.equal(findDuplicateId([{ id: "a" }, { id: "b" }]), undefined);
  assert.equal(findDuplicateId([]), undefined);
});

test("extractIndexUrls: markdown リンクの URL を重複排除して抽出する", () => {
  const text = [
    "- [Memory](https://code.claude.com/docs/en/memory.md): desc",
    "- [Large](https://code.claude.com/docs/en/large-codebases.md): desc",
    "- [Dup](https://code.claude.com/docs/en/memory.md): 再掲",
    "本文中の生 URL https://example.com/x は拾わない",
  ].join("\n");
  const urls = extractIndexUrls(text);
  assert.deepEqual(urls, [
    "https://code.claude.com/docs/en/memory.md",
    "https://code.claude.com/docs/en/large-codebases.md",
  ]);
});

test("stripDiffHeaders: git のファイルヘッダを落とし @@ 以降を残す", () => {
  const diff = [
    "diff --git a/x b/y",
    "index 111..222 100644",
    "--- a/x",
    "+++ b/y",
    "@@ -1 +1 @@",
    "-old",
    "+new",
  ].join("\n");
  assert.deepEqual(stripDiffHeaders(diff), ["@@ -1 +1 @@", "-old", "+new"]);
});

test("unifiedDiff: 差分があれば +/- 行を含む、同一なら空文字", () => {
  const dir = tmp();
  try {
    const oldFile = join(dir, "old.md");
    writeFileSync(oldFile, "line1\nline2\n");
    const diff = unifiedDiff(oldFile, "line1\nCHANGED\n");
    assert.match(diff, /@@/);
    assert.match(diff, /-line2/);
    assert.match(diff, /\+CHANGED/);
    // 同一内容なら git diff は終了コード0＝空文字
    assert.equal(unifiedDiff(oldFile, "line1\nline2\n"), "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("findSpecWatchDir: 祖先の .spec-watch/sources.json を見つける / 無ければ throw", () => {
  const root = tmp();
  try {
    mkdirSync(join(root, ".spec-watch"), { recursive: true });
    writeFileSync(join(root, ".spec-watch", "sources.json"), "{}");
    const nested = join(root, "a", "b", "c");
    mkdirSync(nested, { recursive: true });
    assert.equal(findSpecWatchDir(nested), join(root, ".spec-watch"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  const empty = tmp();
  try {
    assert.throws(() => findSpecWatchDir(empty), /\.spec-watch\/sources\.json/);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

// fetchDoc はネットワークに出ず、注入した fetchImpl で挙動を検証する。
function mockResponse({ ok = true, status = 200, contentType = "text/markdown", body = "# ok\n" }) {
  return {
    ok,
    status,
    headers: { get: (k) => (k.toLowerCase() === "content-type" ? contentType : null) },
    text: async () => body,
  };
}

test("fetchDoc: 正常な markdown を正規化して返す", async () => {
  const got = await fetchDoc("https://x/y.md", {
    fetchImpl: async () => mockResponse({ body: "# title\r\n\r\n" }),
  });
  assert.equal(got, "# title\n");
});

test("fetchDoc: 非 2xx は throw", async () => {
  await assert.rejects(
    () => fetchDoc("https://x/y.md", { fetchImpl: async () => mockResponse({ ok: false, status: 404 }) }),
    /HTTP 404/,
  );
});

test("fetchDoc: content-type が HTML なら throw（CDN/WAF interstitial 検出）", async () => {
  await assert.rejects(
    () => fetchDoc("https://x/y.md", { fetchImpl: async () => mockResponse({ contentType: "text/html" }) }),
    /interstitial/,
  );
});
