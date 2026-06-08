# `.spec-watch/` — 仕様ドリフト監視（著者用・非配布）

このリポジトリの一部スキルは **Claude Code 等のプラットフォーム仕様そのものを記述している**（例: `skills/1natsu-document-harness-model` は CLAUDE.md / `.claude/rules/` のロード挙動を説明する）。上流（公式ドキュメント）が進化すると、これらのスキルは黙って陳腐化（ドリフト）する。

`.spec-watch/` はその追従を仕組み化するための **著者側マニフェスト＋スナップショット**。配布スキル（`skills/`）には一切含めない（利用者に無関係な著者の関心事）。

> エージェント非依存な convention スキル（`1natsu-commit` 等）はプラットフォーム仕様に結合していないので**対象外**。ここで監視するのは「仕様結合スキル」だけ。

## 中身

| パス | 役割 |
|------|------|
| `sources.json` | 監視対象の上流ドキュメント一覧（`{ id, url, label, role, skills, last_checked }`）。`skills` はその doc にドリフト追従すべきスキルのリポジトリ相対パス |
| `snapshots/<id>.md` | 各 source の「前回確認した .md 全文」。差分検出の基準 |

`role` は省略時 `"doc"`（個別ドキュメント）。`"index"` を指定すると、その source（例 `llms.txt`）は**ドキュメント一覧**として扱われ、これ自体を snapshot+diff することで**新ページの追加/削除/リネームを自己検出**する（固定 URL に閉じない）。`check.mjs` はさらに、tracked な doc URL がインデックスに無ければ「移転/削除の疑い」として、取得失敗は `[ERROR]` として報告する（1 source が落ちても全体は止めない）。新ページの relevance 判定と `sources.json` への反映は `spec-drift-watch` スキルのエージェントが行う。

## 関連スキル（`.claude/skills/`、いずれも Internal）

- **`spec-drift-watch`** — 検出器。`scripts/check.mjs` で上流と snapshot を機械的に diff し、変化があれば意味的影響を判定して PR を1本上げる。Cloud Routine から隔週実行する想定。
- **`spec-drift-fix`** — 是正役。ドリフト PR をローカルに checkout した状態で起動し、上流に合わせてスキルを直す（挙動仕様の変化は人間判断で実測検証）。

## 全体の流れ

1. **隔週**（毎月1日・15日）: Cloud Routine → `spec-drift-watch` → 変化あれば `claude/spec-watch-<YYYY-MM-DD>` に snapshot 更新＋ドリフトレポートの PR、変化なしなら無音。
2. 人間が PR をレビュー。影響なしの空振り → そのままマージ（snapshot が進む＝「確認済み」の記録）。
3. 実ドリフト → PR ブランチをローカル checkout → `spec-drift-fix` 起動 → 是正＋（必要なら）実測検証＋ version bump → PR ブランチにコミット。
4. PR を main にマージ（snapshot と修正が一緒に着地）。
5. スキルの version が上がったら `gh skill publish`（`publish-this-repo` スキル経由の別ステップ。マージ≠公開）。

## 手元での実行

リポジトリルートから:

```bash
node .claude/skills/spec-drift-watch/scripts/check.mjs          # ドリフト検出（読み取り専用）
node .claude/skills/spec-drift-watch/scripts/check.mjs --json   # 機械可読 JSON
node .claude/skills/spec-drift-watch/scripts/check.mjs --update # snapshot を上流で更新＋last_checked 更新

node --test .claude/skills/spec-drift-watch/scripts/check.test.mjs   # check.mjs の単体テスト（依存ゼロ・ネットワーク不要）
```

`--update` は「ドリフト PR をレビューし終えて snapshot を確定するとき」または「新しい source を追加して初回シードするとき」に使う。`check.mjs` を変更したら単体テストと実上流に対するランタイム実行の両方で確認する。

## source の追加

`sources.json` の `sources` 配列に要素を足し、`node ... check.mjs --update` を1回流せば `snapshots/<id>.md` が作られる。初期は Claude Code のドキュメントのみだが、他ツール（Cursor 等）の doc URL も将来追加できる。

## Cloud Routine の設定（アカウント側・リポジトリ差分ではない）

Desktop の Routines（`/schedule`）で作成する。リポジトリ差分としてコミットされるものではないため手順だけ記す:

- スケジュール: 「2週ごと」は単一 cron で表せないため、**毎月1日と15日**で近似（例 `0 9 1,15 * *` をローカル→UTC 換算）。
- リポジトリをアタッチ、network=Trusted（`code.claude.com` を許可）、GitHub アクセス有効（PR 作成のため。既定の `claude/*` push 制約のままで可）。
- プロンプト（現セッションに依存しない自己完結文）:
  > このリポジトリの `spec-drift-watch` スキルを実行せよ。変化があれば `claude/spec-watch-<YYYY-MM-DD>` ブランチに snapshot 更新＋レポート PR を1本作る。変化なしなら何もしない。既存 open な spec-watch PR があれば新規作成せず更新する。
