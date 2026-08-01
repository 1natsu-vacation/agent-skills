# Spec-Drift Watch — 2026-08-01

## Spec-Drift Report — 3 changed / 0 errored

前回チェック: 2026-07-15。今回: 2026-08-01。

| 種別 | 対象 | 要約 | 追従スキル | 影響判定 | 推奨アクション |
|------|------|------|-----------|----------|---------------|
| index | claude-code-docs-index | +11/-4。新ページ6件追加（AWS gateway, claude-security, cloud-environments, corporate-launcher, desktop-ios-simulator, mobile）＋週次 whats-new エントリ増＋3件の説明文変更 | — | 関連なし: 追加ページはすべてインフラ/UI/ゲートウェイ/モバイル系。ハーネスモデルの守備範囲（CLAUDE.md/rules/docs/skill ロード挙動）に関わる新仕様記述なし | sources.json への追加不要。snapshot のみ更新 |
| doc | claude-code-memory | +48/-28。内部リンク URL 形式変更（`/en/` → `/docs/en/`）大量＋実質変更5件 | 1natsu-document-harness-model | **影響あり（不足）×2**（下記①②）。影響なし×3（下記③④⑤） | spec-drift-fix で placement-guide.md を更新 |
| doc | claude-code-large-codebases | +50/-41。内部リンク URL 形式変更大量＋実質変更3件 | 1natsu-document-harness-model | **影響あり（不足）×1**（下記⑥）。影響なし×2（下記⑦⑧） | spec-drift-fix で placement-guide.md を更新 |

---

## 詳細：実質変更と影響判定

### ① `paths` glob のブレース展開制限（v2.1.217）【影響あり・不足】

**変化（memory.md の paths-specific-rules 節に新規追加）:**
```
Each brace group multiplies the number of expanded patterns: `src/*.{ts,tsx}` expands to two
patterns, and `{a,b}/{c,d}/*.{ts,tsx}` to eight. To keep expansion bounded, a rule's whole
`paths` list shares one budget of 1,000 expanded patterns and 4 MiB, and patterns without
braces don't count against it.

Claude Code uses any pattern that would exceed the budget unexpanded, and its literal braces
match no files. Before v2.1.217, a `paths` value with many brace groups stalled or crashed
the CLI at startup.
```

**スキルの現状:** `placement-guide.md` の「`paths` glob のマッチング仕様」節は `[` ブラケット式と symlink マッチングを記述しているが、ブレース展開 `{a,b}` の制限には言及がない。  
**判定:** ブレース展開は `paths` glob の一部として同節のスコープ内。上流が新たに明文化した仕様（1000パターン/4MiB 予算、超過時の挙動、v2.1.217 での修正）がスキルに未記述 → **守備範囲内の不足**。

---

### ② rules の `--setting-sources` による除外（v2.1.211）【影響あり・不足】

**変化（memory.md の rules 節に新規追加）:**
```
Project rules are skipped if you exclude `project` from `--setting-sources`.
Before v2.1.211, rules that load on demand, including path-scoped rules and
rules in nested `.claude/rules/` directories, loaded even when `project` was excluded.
```

**スキルの現状:** SKILL.md と placement-guide.md は rules のロードタイミング（起動時 eager / ファイルマッチ時 lazy）を記述するが、`--setting-sources` で `project` を除外したときの挙動には言及がない。  
**判定:** rules ロード挙動はスキルの中核スコープ。`--setting-sources` による除外はそのロード制御機構の一部 → **守備範囲内の不足**。

---

### ③ `/context` コマンドによる CLAUDE.md ロード確認（影響なし）

**変化:** 複数箇所で "To confirm the file loaded, run `/context` in a session and check the list under **Memory files**." が追加。またトラブルシュートの確認手順が `/memory` → `/context` に変更。  
**判定:** スキルの守備範囲はドキュメントの「書き方・配置判断・粒度」。CLI コマンドによる確認手順はその範囲外。影響なし。

---

### ④ 外部 import のセキュリティモデル補足（影響なし）

**変化（Warning ブロックに追記）:**
```
The dialog protects you from files other people commit to a shared project. Imports in
user-scope memory files, such as `~/.claude/CLAUDE.md` and `~/.claude/rules/`, are files
you wrote yourself, so they load without the dialog...
```

**判定:** スキルは `@path` import のロード挙動（起動時フルロード）を扱うが、承認ダイアログの詳細は扱っていない。スコープ外。影響なし。

---

### ⑤ auto memory 系の変更（影響なし）

**変化:** `/memory` トグルのスコープ変更、auto memory の subagent スコープ、MEMORY.md の行数制限ロジック(v2.1.210/211/214)など多数。  
**判定:** スキル SKILL.md は冒頭で "auto memory は別系統で対象外" と明示。影響なし。

---

### ⑥ `.claude/settings.local.json` のロードスコープ変更（v2.1.211）【影響あり・不足】

**変化（large-codebases.md の `claudeMdExcludes` 節）:**
```
If you only want these exclusions for yourself, put the setting in `.claude/settings.local.json`.
Claude Code adds that file to your global gitignore when it saves a setting there.
...Before v2.1.211, `.claude/settings.local.json` also loaded only from the starting directory.
```

意味: リポジトリルートの `.claude/settings.local.json` は **v2.1.211 以降、起動ディレクトリに関わらず全 CLI セッションで読み込まれる**（以前は起動ディレクトリのみ）。

**スキルの現状:** `placement-guide.md` の注記:  
> "プロジェクト `.claude/settings.json` は**起動ディレクトリのものだけ**読まれ、祖先からは継承されない（CLAUDE.md/rules の継承挙動とは別）。"  
`settings.local.json` の挙動には言及がなく、上記注記は `.json`（非 local）の挙動のみ。`claudeMdExcludes` の配置例として `settings.local.json` を参照しており（large-codebases 追従範囲内）、そのロードスコープ変更は配置指示の正確性に関わる → **守備範囲内の不足**。

---

### ⑦ `settings.local.json` の gitignore 挙動の文言変更（影響なし）

**変化:** "Claude Code gitignores that file when it creates it" → "Claude Code adds that file to your global gitignore when it saves a setting there. Since you are creating it by hand here, add it to your gitignore yourself."  
**判定:** gitignore の管理手順。スキルの守備範囲外。影響なし。

---

### ⑧ その他の変更（影響なし）

- `Read` deny rules の配置ガイドライン拡充（everyone / yourself / managed の使い分け）: 設定ファイルの分類であり、ハーネスドキュメントのスコープ外
- コードインテリジェンスプラグインのエラーハンドリング追記: ハーネスモデルのスコープ外
- `sparsePaths` 利用時の複数キー JSON 注記: ハーネスモデルのスコープ外
- 内部リンク URL 形式変更（`/en/` → `/docs/en/`）: 意味変化なし

---

## インデックス変化の relevance 判定詳細

新規追加ページ6件の判定:

| ページ | 説明 | 判定 | 理由 |
|--------|------|------|------|
| `claude-apps-gateway-on-aws.md` | AWS 上での gateway 構築 | 無関係 | インフラ/ネットワーク。ハーネスドキュメント挙動と無関係 |
| `claude-security.md` | セキュリティスキャンプラグイン | 無関係 | プラグイン機能。CLAUDE.md/rules ロード挙動と無関係 |
| `cloud-environments.md` | クラウド環境の設定（ネットワーク/env/セットアップスクリプト/キャッシュ） | 無関係 | 実行環境インフラ設定。ドキュメントハーネスの配置・挙動とは別レイヤー |
| `corporate-launcher.md` | CLAUDE_CODE_PROCESS_WRAPPER / processWrapper 設定 | 無関係 | プロセス起動ラッパー。ハーネスドキュメント挙動と無関係 |
| `desktop-ios-simulator.md` | Desktop の iOS シミュレータペイン | 無関係 | UI/Desktop 機能 |
| `mobile.md` | Claude モバイルアプリ | 無関係 | モバイル UI |

週次 whats-new エントリ（Week 28-29 等）: ハーネスモデルに直接関係する新仕様は上記①②⑥として既に本レポートに含む。whats-new 自体は追跡不要。

**sources.json への変更: なし**（追加すべき新 source はない）

---

## 次のアクション

実ドリフトが3件（①②⑥）あります。このブランチをローカル checkout して `spec-drift-fix` を起動し、`skills/1natsu-document-harness-model/references/placement-guide.md` を是正してください。

是正対象:
1. **①** `paths glob のマッチング仕様` 節にブレース展開の制限を追記（1000パターン/4MiB 予算、超過時は未展開でマッチ不可、v2.1.217 修正）
2. **②** rules のロードタイミング説明に `--setting-sources project` 除外時の挙動を追記（v2.1.211）
3. **⑥** `.claude/settings.json` vs `.claude/settings.local.json` のロードスコープの違いを注記に追記（settings.local.json at repo root は v2.1.211 以降全セッションで読み込まれる）

是正後は `spec-drift-fix` の手順に従い `metadata.version` をインクリメントし、simplify / code-review / eval の品質パスを経てこの PR ブランチにコミットしてください。

---

_Generated by [Claude Code](https://claude.ai/code)_
