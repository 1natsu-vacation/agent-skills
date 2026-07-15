# Agent Skills Repository

## Structure

```
skills/
└── <skill-name>/
    └── SKILL.md       # YAML frontmatter (name, description) + markdown content
```

## Rules

- `skills/` 配下の**配布対象**スキル名には必ず `1natsu-` プレフィックスをつける（名前衝突の回避）。`.claude/skills/` 配下の Internal skill は対象外（配布されないため衝突回避不要）
- ディレクトリ名と SKILL.md の `name` フィールドは一致させる（例: `skills/1natsu-commit/SKILL.md` → `name: 1natsu-commit`）
- `description` はスキルの発動条件を具体的に書く（エージェントがいつ使うか判断する材料になる）
- 内容はエージェント非依存・汎用的に保つ（Claude Code, Cursor, Cline, Codex 等で横断的に使える）
- 1スキル = 1トピック、スコープを絞る
- frontmatter には `license: MIT` と `metadata`（`author`, `version`）を必ず含める。バージョンは更新時にインクリメントする
- Internal skill（`.claude/skills/` 配下）は `metadata.internal: true` を付け、配布チャネルから自動的に隠す

## SKILL.md Template

```markdown
---
name: 1natsu-skill-name
description: When this skill should be activated and what it does.
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
---

# Skill Title

## When to Use
- Activation criteria

## Content
- Guidelines, rules, examples
```

## Evals（スキルの評価資産）

- eval 定義は各スキルの `skills/<name>/evals/evals.json`
- fixture（eval の入力資産）は**再生成不能なので必ず git 管理する**。evals.json が参照するため、欠けると再クローンで evals が実行不能になる。形態は2つ:
  - **生成スクリプト型**（使い捨て環境を作る `.sh` 等）: スキル内 `evals/fixtures/` に置く（例: `1natsu-auto-resolve-conflicts`）
  - **静的ツリー型**（repo・memory 等のスナップショット）: ルートの `eval-fixtures/<ドメイン>/` に置く（例: `eval-fixtures/document-harness/`）
- eval の**実行結果**（iteration 出力）は `skills/<name>-workspace/` に置く。gitignore 対象で、絶対パスや一時状態を含む**再生成可能物のみ**を置く。fixture をここに置かない
- **新旧スキルの比較 eval の設計知見**: 有能な executor は旧版スキルでも即興でギャップを埋めて正解に到達しうるため、挙動差のアサーションは executor が即興できない**手続き的・構造的要素**（例: 2段コミット規約）に置く。挙動差が出なくても、正しい手順の明示化・bail-out 規律・弱い executor への恩恵はスキル変更の正当化理由として別途成立する

## Validation

```bash
bunx skills add . --list      # スキルが認識されるか確認（Internal skill は隠れる）
bunx skills add . -g -y       # グローバルインストール
gh skill publish --dry-run .  # Agent Skills 仕様に沿っているかリポジトリ全体で検証（gh CLI v2.90.0+）
```

## Distribution

**git push はリポジトリ更新であって公開ではない。** 公開は `gh skill publish` が唯一の正規チャネル。

- 公式公開チャネル: `gh skill publish`（手動・対話モード、要 gh CLI v2.90.0+）— GitHub Release＋semver タグを作成
- 互換チャネル（main 追従、リリースタグではない）:
  - Vercel `skills` 互換（`bunx skills` / `npx skills add`）
  - apm Primitive Form（`apm install --skill` で個別スキル取得、`apm.yml` 不要）

公開手順は `.claude/skills/publish-this-repo` (Internal skill) に集約。エージェントに「公開して」と伝えれば自動でガイドする。

チャネル選定の判断・経緯（apm Primitive Form 維持の理由と再検討トリガー、運用形態）は `docs/distribution-policy.md` を参照。

## Spec-Drift Watch（仕様追従・著者用）

プラットフォーム仕様に結合したスキル（例 `1natsu-document-harness-model`）は、上流の公式ドキュメント進化で陳腐化する。その追従を仕組み化している（非配布・著者関心）:

- `.spec-watch/` — 監視マニフェスト `sources.json` ＋ 差分基準の `snapshots/`。詳細は `.spec-watch/README.md`。
- `.claude/skills/spec-drift-watch` (Internal skill) — 検出器。`scripts/check.mjs`（依存ゼロ Node）で上流と diff し、変化があればドリフトレポート PR を1本上げる。Cloud Routine から隔週実行する想定。
- `.claude/skills/spec-drift-fix` (Internal skill) — 是正役。ドリフト PR をローカル checkout した状態で起動し、上流に追従してスキルを直す（挙動仕様の変化は実測で裏取り）。
