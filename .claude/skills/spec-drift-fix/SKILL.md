---
name: spec-drift-fix
description: spec-drift-watch が上げたドリフト PR をローカルに checkout した状態で起動し、上流ドキュメントの変化に合わせて仕様結合スキル（1natsu-document-harness-model 等）を是正する。レポートを読み、上流を再 fetch して直すべき記述を特定し、挙動仕様の変化なら実測で裏取りしてから修正、version をインクリメントし、simplify / code-review / eval の既存品質パスを回して PR ブランチにコミットする。「ドリフト是正して」「spec-drift-fix して」「この spec-watch PR を直して」等で起動する。検出・PR 作成そのものは spec-drift-watch の責務でありこのスキルではない。
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
  internal: true
---

# Spec-Drift Fix — ドリフト是正オーケストレータ

`spec-drift-watch` が検出して上げた**ドリフト PR をローカルで是正する**薄い汎用オーケストレータ。検出は済んでいる前提で、ここでは「上流に合わせてスキルを直す」ことに集中する。

背景・全体像は `.spec-watch/README.md` を参照。

## When to Use

- `spec-drift-watch` の PR（`claude/spec-watch-<YYYY-MM-DD>`）をローカルに checkout し、実ドリフトを是正するとき
- 「ドリフト是正して」「spec-drift-fix して」「この spec-watch PR を直して」と言われたとき

**使わない場面**:
- ドリフトの検出・PR 作成 → `spec-drift-watch`
- 現セッションの実装ドキュメント化 → `1natsu-document-harness`

## 前提

- PR ブランチ（`claude/spec-watch-*`）が checkout 済みで、`.spec-watch/snapshots/` が更新後（新上流）の状態になっている。tracking を確実にするため `gh pr checkout <番号>` での取得を推奨（後段の push が bare で通る）。
- 上流ホストに到達できる（修正対象の確認に再 fetch する）。

## ワークフロー

```
レポート読込 → 上流再確認 → 直すべき記述の特定 → 【検証ゲート】 → 修正＋version bump → 品質パス → コミット
```

### ステップ1: ドリフトレポートを読む

PR 本文（または直近のコミットメッセージ）の Spec-Drift Report を読み、「影響あり」と判定された source と追従スキル・疑わしい箇所を把握する。「影響なし」の空振り PR なら是正は不要 — その旨を伝えて終了（snapshot 進行のマージは人間が行う）。

`.spec-watch/snapshots/<id>.md` の git 差分（このブランチで何が変わったか）も確認すると、上流の変化点が正確に分かる:

```bash
git log -p -1 -- .spec-watch/snapshots/
```

### ステップ2: 上流を再確認し、直すべき記述を特定する

影響ありの各 source について:

1. 上流 doc を再 fetch する（snapshot と一致するはずだが、レポートの判定を自分の目で裏取りする）。
2. 追従スキル（`sources.json` の `skills`、例 `skills/1natsu-document-harness-model/SKILL.md` と `references/`）を読む。
3. スキル側の記述のうち、上流変化で **不正・不足・余剰** になった箇所を具体的に列挙する（ファイル・行・現記述・あるべき記述）。

### ステップ3: 検証ゲート（人間判断・自動化しない）

修正の前に、変化の種類を見極める。**ここは人間の判断を仰ぐポイントであり、機械的に飛ばさない**。

- **挙動仕様の変化**（ロードのタイミング、パス解決、frontmatter の効き方など、"実際にどう動くか" が変わった可能性）→ **推測で書き換えない。専用プローブを設計して実測する。** 例: 使い捨て環境＋`InstructionsLoaded` フックでロード理由・タイミングを計測する（今セッションで harness-model を是正した時の手法が worked example）。判断基準はメモリ『挙動が不確かなら実測で確定』(`feedback_empirical_verification.md`) を参照。
- **表現・構成レベルの変化**（用語の言い換え、節の再編、例の差し替えで意味は不変）→ 実測は不要。テキストとして追従する。

実測が必要かどうか・どう測るかは、ユーザーに確認・相談してから進める。

### ステップ4: スキルを修正し version を上げる

裏取りできた事実に基づいてスキルを修正する。

- 修正は「上流の新仕様に正確に一致」させる。憶測や過剰一般化を入れない。
- 修正したスキルの frontmatter `metadata.version` をインクリメントする（挙動記述の訂正は minor、表現修正は patch を目安に）。
- そのスキルに `references/` や `evals/` があれば、整合するよう一緒に直す。

### ステップ5: 既存の品質パスを回す

新規に作らず、リポジトリ既存の仕組みを再利用する:

1. `/simplify` — 変更コード/ドキュメントの簡潔化。
2. `/code-review` — 変更の不整合・抜けをレビュー。
3. 該当スキルに `evals/evals.json` があれば実走し、修正後の挙動が期待どおりかを確認する。

指摘を反映する。

### ステップ6: PR ブランチにコミットする

```bash
git add skills/<修正したスキル>/
git commit -m "fix(<skill>): 上流仕様ドリフトに追従（<要点>）"
git push -u origin HEAD   # tracking 未設定でも確実に push する（gh pr checkout 済みなら bare push でも可）
```

snapshot 更新（spec-drift-watch のコミット）と是正（このコミット）が同じ PR に乗る。PR を main にマージすれば両者が一緒に着地する。

### ステップ7: 公開は別ステップ

version が上がったスキルは、マージ後に `publish-this-repo` スキル（「公開して」で起動）経由で `gh skill publish` する。**マージ≠公開**。このスキルでは公開しない。

## 設計上の注意

- **骨格は汎用に保つ**: 監視対象や追従スキルが増えても、`sources.json` の `skills` を辿れば同じ流れで是正できる。今セッションの harness-model 是正手順は「worked example」であって、特定スキル専用の手順に固定しない（n=1 過適合の回避）。
- **検証ゲートを飛ばさない**: 挙動仕様の変化を「たぶんこうだろう」で書き換えると、ドリフト是正のはずが新たな誤りを埋め込む。不確かなら実測。
- **是正と検出の分離**: snapshot の前進（確認済み記録）は `spec-drift-watch` が、スキル本体の訂正はこのスキルが担う。
