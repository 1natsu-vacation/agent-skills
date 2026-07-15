---
name: spec-drift-watch
description: agent-skills リポジトリ内の「プラットフォーム仕様に結合したスキル」（CLAUDE.md / .claude/rules/ のロード挙動などを記述するスキル、現状は 1natsu-document-harness-model）が、上流の公式ドキュメント進化によって陳腐化していないかを検出する。.spec-watch/sources.json の各上流 doc を取得し前回スナップショットと diff、変化があれば追従スキルへの意味的影響を判定して PR を1本上げる。Cloud Routine から隔週で自律実行される想定だが、「ドリフトチェックして」「仕様追従を確認して」「spec-drift-watch を回して」等で手動起動もできる。是正そのものは行わず検出と報告に徹する（是正は spec-drift-fix）。
license: MIT
metadata:
  author: 1natsu
  version: "1.1.0"
  internal: true
---

# Spec-Drift Watch — 仕様結合スキルのドリフト検出器

上流ドキュメント（Claude Code 等のプラットフォーム仕様）の変化を機械的に検出し、その変化が追従スキルに意味的影響を与えるかを判定して、ドリフトレポート PR を1本上げる**検出専用**スキル。**是正はしない**（それは `spec-drift-fix` の責務）。

背景・全体像は `.spec-watch/README.md` を参照。監視対象は `.spec-watch/sources.json`。

## When to Use

- Cloud Routine から隔週（毎月1日・15日）で自律実行されるとき（主たる用途）
- 「ドリフトチェックして」「仕様追従を確認して」「spec-drift-watch を回して」と言われたとき
- 上流ドキュメントが更新された気配があり、仕様結合スキルの陳腐化を確認したいとき

**使わない場面**:
- 検出済みドリフトを実際に直す → `spec-drift-fix`
- 現セッションの実装をドキュメント化する → `1natsu-document-harness`
- 既存ドキュメント全般の陳腐化監査 → `1natsu-document-harness-audit`（こちらは「自分のリポジトリのドキュメント」を見る。spec-drift-watch は「上流仕様」を見る点が違う）

## 前提

- リポジトリルートで作業する（Cloud Routine はリポジトリを fresh clone する）。
- ネットワークは `code.claude.com` 等、`sources.json` のホストに到達できること（Routine は network=Trusted）。
- `node`（または `bun`）が使えること。`scripts/check.mjs` は依存ゼロ。

## ワークフロー

```text
機械的検出（check.mjs）→ 変化ゼロ＆エラーなしなら終了 → インデックス変化/取得エラー/移転候補の処理 → 変化分の意味的影響判定 → レポート生成 → 冪等に PR を1本
```

### ステップ1: 機械的にドリフトを検出する

リポジトリルートから検出器を実行する（**読み取り専用**、snapshot は書き換えない）:

```bash
node .claude/skills/spec-drift-watch/scripts/check.mjs
```

`check.mjs` は `sources.json` の各 url を取得し、`snapshots/<id>.md` と diff して結果を出力する。機械可読に処理したい場合は `--json` を付ける。出力に現れる区分:

- `[CHANGED]` — doc 本文が変化（unified diff 要約つき）。
- `[CHANGED(index)]` — `role:"index"`（llms.txt 等）のドキュメント一覧が変化＝新ページ追加/削除/リネーム。
- `[UNCHANGED]` — 変化なし。
- `[ERROR]` — 取得失敗（HTTP エラー・content-type が HTML 等）。1 source が落ちても全体は止まらない。
- 「tracked URL がインデックスに無い（移転/削除の疑い）」セクション — 追従中の doc URL が現在のインデックスから消えている。

**`SUMMARY` が `0 changed, 0 errored` かつ移転候補ゼロなら、ここで終了する。PR を作らない。何もしないことが正しい挙動**（無音）。

### ステップ2: インデックス変化・取得エラー・移転候補を処理する

`[CHANGED(index)]` / `[ERROR]` / 移転候補 が出たときに対応する（無ければこのステップは飛ばす）。**ここで新ページの自己検出と `sources.json` の更新を行う**:

- **`[CHANGED(index)]`（ドキュメント一覧の変化）**: diff の追加行＝新ページ、削除行＝消えたページ。各**新ページ**を「仕様結合スキルに関係するか」（CLAUDE.md / `.claude/rules/` / memory / skills / monorepo のロード・配置挙動など）で relevance 判定する（llms.txt の各行末の説明文が手がかり）。関係するなら **`sources.json` に新 source（`role:"doc"`、適切な `skills`）として追加（Edit）し**、`node .claude/skills/spec-drift-watch/scripts/check.mjs --update` で snapshot をシードして以後の追従対象にする。関係が薄ければ追加せず、判断理由をレポートに残す。
- **`[ERROR]` / 移転候補（tracked URL がインデックスに無い）**: ページが移転・改名・削除された可能性。インデックスやサイトを当たって新 URL を特定し、`sources.json` の `url` を更新（Edit）するか、廃止なら source を削除する。
- `sources.json` を編集したら、その変更も同じ PR に含める（snapshot シード分も）。

### ステップ3: 変化分の意味的影響を判定する

`changed` な source が1つ以上あるときだけ続行する。各変化 source について:

1. その source の `skills`（追従スキルのパス）を `sources.json` から読む。
2. 該当スキル（例 `skills/1natsu-document-harness-model/SKILL.md` と `references/`）を読む。
3. **変化分の新テキスト**（diff の追加行／更新後の上流）とスキルの記述を突き合わせ、影響を判定する。判定は **「不正・不足・余剰」の3分類**で行う（`spec-drift-fix` ステップ2の是正でも同じ語彙を使い、検出と是正で基準を揃える。**分類の定義は本ステップが正**）:

   - **不正（影響あり）**: スキルが具体的に記述している仕様（ロード挙動、frontmatter キー、パス解決、用語）が上流変化で**誤りになった**。旧仕様前提の記述が残っている。
   - **不足（影響あり）**: 上流が、スキルが**カバーを標榜する領域**（該当節がスコープに含む挙動・設定）に**新しい仕様を明文化**したのに、スキル側にその記述が無い。──**既存の記述が誤りになるかは問わない**。守備範囲内の上流追加は「まだ書けていない」時点でドリフトであり、今の版で「影響あり」に倒す。
   - **余剰（影響あり）**: 上流が仕様を削除・廃止したのに、スキルにその記述が残っている。
   - **影響なし**: 上流変化がスキルの守備範囲**外**（無関係なページの追記、スキルが扱わない機能の変更、表現変更のみで意味不変）。

   **アンチパターンと迷ったときの既定**: 「既存文が誤りにならないから影響なし／将来改訂候補」と倒すのは誤判定（不足の見落とし）。また**守備範囲内か判断に迷うときは「影響あり（不足）・要確認」側に倒す**（偽陰性より偽陽性を許容。挙動仕様かどうかの実証と最終判断は spec-drift-fix の人間ゲートが行う）。
   → worked example: PR #14 で、上流が `paths` glob の `[` ブラケット式（文字クラス）挙動を新たに明文化した。`1natsu-document-harness-model` の `placement-guide.md` は glob によるパス配置判断を既にカバーしているが `[` 記法の記述は無かった。既存文は誤りにならないが**守備範囲内の不足**なので「影響あり」。当時 watch はこれを「影響なし・将来改訂候補」に倒し期待値未達だった（この基準はその反省から明文化した）。

**ここで実測（プローブ実行）はしない。** テキスト・意味レベルの判定に留める。挙動仕様が本当に変わったかの実証は人間ゲートの `spec-drift-fix` 側で行う。判定は「影響あり（不正／不足／余剰のどれか）／なし＋疑わしい箇所」を示すまで。

### ステップ4: ドリフトレポートを生成する

`1natsu-document-harness-audit` の提案テーブル形式に倣う。1行 = 1つの変化/イベント。doc 本文ドリフトだけでなく、インデックス変化（新ページ）・取得エラー・移転候補も行として載せる:

```markdown
## Spec-Drift Report — N changed / M errored

| 種別 | 対象 | 要約 | 追従スキル | 影響判定 | 推奨アクション |
|------|------|------|-----------|----------|---------------|
| doc | claude-code-memory | +12/-3。auto memory のパス記述が変更 | 1natsu-document-harness-model | 影響あり（不正）: L15 の境界注記が旧パス前提 | spec-drift-fix で L15 を更新、必要なら実測 |
| doc | claude-code-paths | +6/-0。glob の `[` 文字クラス挙動を新規明文化 | 1natsu-document-harness-model | 影響あり（不足）: placement-guide の glob 節がスコープ内だが未記述 | spec-drift-fix で glob 節に追記（挙動なら実測） |
| doc | claude-code-settings | +0/-5。旧パス規約が上流から削除 | 1natsu-document-harness-model | 影響あり（余剰）: 廃止済み規約の記述がスキルに残存 | spec-drift-fix で該当記述を削除 |
| doc | claude-code-large-codebases | +1/-0。無関係な節追記 | 1natsu-document-harness-model | 影響なし | snapshot 更新のみ（確認済み記録） |
| index | claude-code-docs-index | 新ページ `settings.md` 追加 | — | 関連あり（rules ロード設定） | sources.json に追加済み・seed 済み |
| error/移転 | claude-code-XXX | HTTP 404 | 1natsu-... | 要確認 | 新 URL を特定し sources.json を更新 |
```

「影響なし」の空振りも**行として残す**（snapshot を進めること自体が「この版まで確認した」記録になる）。

### ステップ5: 冪等に PR を1本作る

0. **レポートをファイルに用意する**。ステップ4のレポートに「実ドリフトがあれば、このブランチをローカル checkout して `spec-drift-fix` を起動して是正してください」の次アクションを足し、ファイルに書き出しておく（例 `report.md`）。PR 本文は diff 由来のバッククォートや `$(...)` を含みうるので、**必ず `--body-file` で渡す**（`--body "..."` のインライン渡しはシェル展開で本文が壊れる／注入される）。

1. **既存 PR を確認**（冪等性）。open な spec-watch PR があれば新規作成せず、それを更新する:

   ```bash
   gh pr list --state open --json number,headRefName,createdAt \
     --jq '[.[] | select(.headRefName | startswith("claude/spec-watch-"))] | sort_by(.createdAt)'
   ```

   - **1件ヒット**: その PR を更新する（下の「既存 PR 更新パス」へ）。
   - **複数ヒット**（通常は起きない）: 最新（`createdAt` 最大）のものを更新対象とし、それ以外の古い spec-watch PR は「重複なので手動で閉じるか整理してください」とレポートに明記する（PR 乱立防止）。
   - **0件**: 「新規 PR パス」へ。

   **既存 PR 更新パス**（番号を `$PR` とする）:

   ```bash
   gh pr checkout "$PR"          # tracking 付きで checkout（bare push が通る状態になる）
   node .claude/skills/spec-drift-watch/scripts/check.mjs --update
   git add .spec-watch/
   git commit -m "chore(spec-watch): snapshot 更新（$(date -u +%Y-%m-%d)）"
   git push
   gh pr edit "$PR" --body-file report.md
   ```

   これで完了。以降の「新規 PR パス」は実行しない。

2. **新規 PR パス**。新規ブランチを切る。隔週運用で月内2回走るため**日付粒度**で衝突回避（日付は check.mjs の `last_checked` と揃えるため UTC）:

   ```bash
   git switch -c claude/spec-watch-$(date -u +%Y-%m-%d)
   ```

3. **snapshot を確定**する（変化分を上流の新内容で書き換え、`last_checked` を更新）:

   ```bash
   node .claude/skills/spec-drift-watch/scripts/check.mjs --update
   ```

4. snapshot 更新と `sources.json` をコミットする（**スキル本体は触らない**＝是正は別ステップ）:

   ```bash
   git add .spec-watch/
   git commit -m "chore(spec-watch): snapshot 更新（仕様ドリフト検出 $(date -u +%Y-%m-%d)）"
   git push -u origin HEAD
   ```

5. レポートを本文にして PR を作成する（本文はファイル渡し）:

   ```bash
   gh pr create --title "Spec-drift watch: $(date -u +%Y-%m-%d)" --body-file report.md
   ```

## 設計上の注意

- **検出と是正を分離**: このスキルは snapshot を進めて「気づき」を PR にするだけ。スキル本体の修正・version bump・実測検証は `spec-drift-fix`（人間ゲート）が行う。
- **空振りはノイズではない**: 影響なしでも snapshot を進める PR は「ここまで上流を確認した」という監査痕跡。そのままマージしてよい。
- **「不足」を見落とさない**: 影響判定は「不正・不足・余剰」の3分類（ステップ3）。既存文が誤りにならなくても、スキルの守備範囲内に上流が新仕様を明文化したら「不足」＝影響あり。「まだ壊れていないから将来送り」で取りこぼさない。
- **変化ゼロで PR を作らない**: 無音が正常。PR 乱立を防ぐ。
- **固定 URL に閉じない**: `role:"index"` の source（llms.txt）を毎回 diff するので、上流が新ページを増やしても気づける。tracked URL の移転/削除も「インデックスに無い」「取得エラー」で surface する。新ページの relevance 判定と `sources.json` への反映はエージェント（ステップ2）が行う。
- **1 source の不達で全体を止めない**: `check.mjs` は per-source でエラーを捕捉し `[ERROR]` として報告して継続する。`--update` は取得成功した source だけ `last_checked` を進める。
- 監視対象を増やすときは `sources.json` に source を足すだけ（`spec-drift-fix` も追従スキルを `skills` から辿るので汎用）。

## メンテナンス（check.mjs のテスト）

`check.mjs` は Node 組み込みテストランナー（依存ゼロ）で単体テストしてある。ネットワークには出ない（`fetchDoc` は注入 fetch でモック、`unifiedDiff` は git＋tmp のみ）:

```bash
node --test .claude/skills/spec-drift-watch/scripts/check.test.mjs
```

`check.mjs` を変更したらこのテストと、実上流に対するランタイム実行（`node .claude/skills/spec-drift-watch/scripts/check.mjs`）の両方で確認する。
