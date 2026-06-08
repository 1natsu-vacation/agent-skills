#!/usr/bin/env node
// Spec-drift detector for spec-coupled skills.
//
// 依存ゼロの Node スクリプト（組み込み fetch + node:* のみ。node でも bun でも動く）。
// 上流ドキュメント（.spec-watch/sources.json の各 url）を取得し、前回スナップショット
// （.spec-watch/snapshots/<id>.md）と差分比較して「変化あり source」を機械的に検出する。
// 影響判定（意味的に追従スキルへ効くか）はこのスクリプトの仕事ではなく、spec-drift-watch
// スキル本文でエージェントが行う。ここは決定論的な検出だけに徹する。
//
// role:"index" の source（例 llms.txt）はドキュメント一覧そのもの。これを snapshot+diff
// することで「新ページ追加 / 削除 / リネーム」がドリフトとして surface する。加えて、
// tracked な doc URL がインデックスから消えていれば「移転/削除の疑い」として報告する。
//
// 使い方:
//   node check.mjs            ドリフト検出（読み取り専用）。人間可読レポートを出力
//   node check.mjs --json     ドリフト検出。機械可読 JSON を stdout に出力
//   node check.mjs --update   上流を取得し、変化/新規 source の snapshot を書き換え、
//                             成功 source の last_checked を更新する（PR レビュー後の
//                             snapshot 確定、または初回シードに使う）
//
// 終了コード: 0 = 正常終了（差分・per-source エラーの有無に関わらず。エラーはレポートに記載）、
//             2 = 致命的エラー（manifest 不正・重複 id・.spec-watch 未検出）。
//
// 純粋関数（normalize / countChanges / findDuplicateId / extractIndexUrls /
// stripDiffHeaders）と fetchDoc / unifiedDiff / findSpecWatchDir / main を export して
// check.test.mjs からテストできるようにしてある。直接実行されたときだけ main() が走る
// （末尾の entry guard）。

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

export const FETCH_TIMEOUT_MS = 20_000;
const DIFF_CONTEXT = 3;
const DIFF_SUMMARY_MAX_LINES = 60;

// ---- 純粋関数（副作用なし・テスト対象） ----

// 先頭 BOM を除去し、改行コード（CRLF / 単独 CR）を LF に統一し、末尾の余分な
// 空白・空行を1つの改行に正規化する。行内の差分はマスクしない（最小限の正規化）。
// CDN ノード差や手編集による改行コード揺れで偽ドリフトが出るのを防ぐ。
// 末尾除去は trimEnd()（正規表現のバックトラックなし）で行う。
export function normalize(text) {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return body.replace(/\r\n?/g, "\n").trimEnd() + "\n";
}

// unified diff から追加/削除行数を数える（+++/--- のファイルヘッダは除外）。
export function countChanges(diff) {
  let add = 0;
  let del = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) add++;
    else if (line.startsWith("-") && !line.startsWith("---")) del++;
  }
  return { add, del };
}

// sources 配列から最初に重複している id を返す（なければ undefined）。
// id は snapshots/<id>.md に1対1で対応するため、重複は snapshot を上書きし合い差分基準を壊す。
export function findDuplicateId(sources) {
  const ids = sources.map((s) => s.id);
  return ids.find((id, i) => ids.indexOf(id) !== i);
}

// llms.txt 等のインデックス本文から doc の URL を抽出する（markdown リンクの () 内）。
export function extractIndexUrls(indexText) {
  const urls = new Set();
  const re = /\]\((https?:\/\/[^)\s]+)\)/g;
  let m;
  while ((m = re.exec(indexText)) !== null) urls.add(m[1]);
  return [...urls];
}

// 人間可読レポート用に git diff のファイルヘッダ（temp パスを含む）を落とし、
// @@ ハンク以降だけを残す。
export function stripDiffHeaders(diff) {
  return diff.split("\n").filter((l) => !/^(diff --git |index |--- |\+\+\+ )/.test(l));
}

// ---- IO（main から使用。fetchDoc/unifiedDiff はテストからも呼べる） ----

// スクリプトの場所から上方向に辿り、兄弟に .spec-watch/sources.json を持つディレクトリ
// （＝リポジトリルート）を探す。起動 cwd に依存しないため。見つからなければ throw。
export function findSpecWatchDir(startDir) {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    const candidate = join(dir, ".spec-watch");
    if (existsSync(join(candidate, "sources.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("スクリプトの位置から上方向に .spec-watch/sources.json を見つけられなかった");
}

// 上流 doc を取得し正規化して返す。エラー時は throw（呼び出し側が per-source で捕捉）。
export async function fetchDoc(url, { timeoutMs = FETCH_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // CDN/WAF のチャレンジページやソフト404 は 200＋HTML で返ることがある。
    // それを markdown と誤認して snapshot を汚染しないよう content-type を確認する。
    const contentType = res.headers.get("content-type") ?? "";
    if (/html/i.test(contentType)) {
      throw new Error(`expected markdown/text but got "${contentType}" — CDN/WAF interstitial?`);
    }
    return normalize(await res.text());
  } finally {
    clearTimeout(timer);
  }
}

let diffSeq = 0;

// git diff --no-index で正規の unified diff を得る（git はこのワークフローで常に存在）。
// 終了コードの意味: 0 = 差分なし、1 = 差分あり（正常系）、>=2 や spawn 失敗 = 実エラー。
// status===1 だけを正常系として扱う。oldFile は呼び出し前に existsSync 済み、tmp も直前に
// 書き込み済みなので、ここで status 1 = 差分ありと確定できる。
export function unifiedDiff(oldFile, newContent) {
  const tmp = join(tmpdir(), `spec-drift-${process.pid}-${diffSeq++}.md`);
  writeFileSync(tmp, newContent);
  try {
    return execFileSync(
      "git",
      ["diff", "--no-index", `--unified=${DIFF_CONTEXT}`, "--", oldFile, tmp],
      { encoding: "utf8" },
    );
  } catch (e) {
    if (e.status === 1) return (e.stdout ?? "").toString();
    const detail = (e.stderr ?? "").toString().trim() || e.message;
    throw new Error(`git diff failed (status ${e.status ?? e.code}): ${detail}`);
  } finally {
    try {
      unlinkSync(tmp);
    } catch {}
  }
}

// 1 source を検査して結果オブジェクトを返す（fetch 失敗は error フィールドに記録、throw しない）。
async function checkSource(src, snapshotsDir) {
  const snapPath = join(snapshotsDir, `${src.id}.md`);
  const hasSnap = existsSync(snapPath);
  try {
    const fresh = await fetchDoc(src.url);
    const prev = hasSnap ? normalize(readFileSync(snapPath, "utf8")) : null;
    // snapshot 未作成（prev === null）でも fresh は非空文字列なので prev !== fresh は真。
    // ＝新規 source は自動的に「変化あり」に含まれる。
    const changed = prev !== fresh;
    let diff = "";
    let counts = { add: 0, del: 0 };
    if (changed && hasSnap) {
      diff = unifiedDiff(snapPath, fresh);
      counts = countChanges(diff);
    }
    return { src, snapPath, hasSnap, fresh, changed, diff, counts, error: null };
  } catch (e) {
    // 1 source が落ちても全体を止めない（移転/削除/一時的な不達を切り分けて報告する）。
    return { src, snapPath, hasSnap, fresh: null, changed: false, error: e.message };
  }
}

// ---- main（直接実行時のみ末尾の entry guard から呼ばれる） ----

export async function main(argv = process.argv.slice(2)) {
  const flags = new Set(argv);
  const MODE_UPDATE = flags.has("--update");
  const MODE_JSON = flags.has("--json");

  const specDir = findSpecWatchDir(dirname(fileURLToPath(import.meta.url)));
  const manifestPath = join(specDir, "sources.json");
  const snapshotsDir = join(specDir, "snapshots");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const sources = manifest.sources ?? [];

  const dupId = findDuplicateId(sources);
  if (dupId) throw new Error(`duplicate source id "${dupId}" in sources.json — ids must be unique`);

  const results = [];
  for (const src of sources) results.push(await checkSource(src, snapshotsDir));

  const role = (r) => r.src.role ?? "doc";
  const ok = results.filter((r) => !r.error);
  const errored = results.filter((r) => r.error);
  const changedResults = ok.filter((r) => r.changed);

  // インデックス（llms.txt 等）に載っている URL 集合。tracked な doc がここに無ければ移転/削除の疑い。
  const indexUrls = new Set(ok.filter((r) => role(r) === "index").flatMap((r) => extractIndexUrls(r.fresh)));
  const movedOrRemoved =
    indexUrls.size > 0
      ? ok.filter((r) => role(r) === "doc" && !indexUrls.has(r.src.url)).map((r) => r.src)
      : [];

  if (MODE_UPDATE) {
    mkdirSync(snapshotsDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    for (const r of changedResults) writeFileSync(r.snapPath, r.fresh);
    // 取得に成功した source だけ last_checked を更新（落ちた source は古い日付を残し staleness を示す）。
    const okIds = new Set(ok.map((r) => r.src.id));
    for (const src of sources) if (okIds.has(src.id)) src.last_checked = today;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  if (MODE_JSON) {
    const payload = {
      checked: results.length,
      changed: changedResults.map((r) => ({
        id: r.src.id,
        url: r.src.url,
        role: role(r),
        skills: r.src.skills ?? [],
        new_source: !r.hasSnap,
        add: r.counts.add,
        del: r.counts.del,
      })),
      unchanged: ok.filter((r) => !r.changed).map((r) => r.src.id),
      errored: errored.map((r) => ({ id: r.src.id, url: r.src.url, message: r.error })),
      moved_or_removed: movedOrRemoved.map((s) => ({ id: s.id, url: s.url })),
      updated: MODE_UPDATE,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return payload;
  }

  const lines = [`SPEC-DRIFT CHECK — ${results.length} source(s)`, ""];
  for (const r of results) {
    if (r.error) {
      lines.push(`[ERROR] ${r.src.id}  (${r.src.url})`);
      lines.push(`  ${r.error} — 移転/削除/一時的な不達の可能性。要確認`);
      lines.push("");
      continue;
    }
    if (!r.changed) {
      lines.push(`[UNCHANGED] ${r.src.id}  (${r.src.url})`);
      continue;
    }
    const tag = role(r) === "index" ? "CHANGED(index)" : "CHANGED";
    lines.push(`[${tag}] ${r.src.id}  (${r.src.url})`);
    if (role(r) === "index") {
      lines.push("  ドキュメント一覧が変化。diff の追加/削除行（新ページ/削除ページ）を relevance 判定すること");
    } else {
      lines.push(`  tracks: ${(r.src.skills ?? []).join(", ") || "(none)"}`);
    }
    if (!r.hasSnap) {
      lines.push(`  new source — no prior snapshot (${r.fresh.split("\n").length} lines)`);
    } else {
      lines.push(`  +${r.counts.add} / -${r.counts.del} lines`);
      const diffLines = stripDiffHeaders(r.diff);
      lines.push("  --- diff (truncated) ---");
      for (const dl of diffLines.slice(0, DIFF_SUMMARY_MAX_LINES)) lines.push("  " + dl);
      if (diffLines.length > DIFF_SUMMARY_MAX_LINES) {
        lines.push(`  ... (${diffLines.length - DIFF_SUMMARY_MAX_LINES} more diff lines)`);
      }
    }
    lines.push("");
  }

  if (movedOrRemoved.length > 0) {
    lines.push("--- tracked URL がインデックスに無い（移転/削除の疑い） ---");
    for (const s of movedOrRemoved) lines.push(`  ${s.id}  (${s.url})`);
    lines.push("");
  }

  lines.push(
    `SUMMARY: ${changedResults.length} changed, ${ok.length - changedResults.length} unchanged, ${errored.length} errored` +
      (movedOrRemoved.length ? `, ${movedOrRemoved.length} maybe-moved` : ""),
  );
  if (MODE_UPDATE) {
    lines.push(`UPDATED: ${changedResults.length} snapshot(s) rewritten; last_checked bumped for ${ok.length} ok source(s)`);
  }
  process.stdout.write(lines.join("\n") + "\n");
  return { changed: changedResults.length, errored: errored.length };
}

// 直接実行されたときだけ main を走らせる（import 時＝テスト時は走らない）。
// symlink 経由の起動（macOS の /var→/private/var 等）でもズレないよう realpath で比較する。
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main().catch((e) => {
    process.stderr.write(`spec-drift check: ${e.message}\n`);
    process.exit(2);
  });
}
