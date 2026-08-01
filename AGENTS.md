# Agent Skills Repository

## Structure

```
.claude-plugin/
└── marketplace.json   # スキルを plugin（install の束）に分ける配布マニフェスト
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
- 配布対象スキルを追加・削除したら `.claude-plugin/marketplace.json` の該当 plugin の `skills[]` と README.md の一覧も更新する。登録漏れのスキルは Claude Code plugin チャネルに載らず、Vercel `skills` の UI では "Other" に落ちる（規約の詳細は「marketplace.json の規約」）

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
bunx skills add . --list      # スキルが認識されるか確認（Internal skill は隠れる／plugin のグループ表示も確認できる）
bunx skills add . -g -y       # グローバルインストール
gh skill publish --dry-run .  # Agent Skills 仕様に沿っているかリポジトリ全体で検証（gh CLI v2.90.0+）
claude plugin validate .      # marketplace.json の検証（renames の循環・終端も検査される）
```

互換チャネルはデフォルトブランチを追従するため、**main へのマージが実質の公開**になる。壊れた状態を配らないよう、配布物の実機確認はブランチのまま（push 不要）ローカルパスで済ませる。手順と注意点は `docs/local-verification.md` を参照。

## Distribution

**git push はリポジトリ更新であって公開ではない。** 公開は `gh skill publish` が唯一の正規チャネル。

- 公式公開チャネル: `gh skill publish`（手動・対話モード、要 gh CLI v2.90.0+）。GitHub Release＋semver タグを作成する
- 互換チャネル（デフォルトブランチ追従、リリースタグではない）:
  - Vercel `skills` 互換（`bunx skills` / `npx skills add`）
  - apm（Skill collection として認識される。`apm install --skill` で個別スキル取得、`apm.yml` 不要）
  - Claude Code plugin marketplace（`.claude-plugin/marketplace.json`、`/plugin marketplace add`）

公開手順は `.claude/skills/publish-this-repo` (Internal skill) に集約。エージェントに「公開して」と伝えれば自動でガイドする。

チャネル選定の判断・経緯（apm Primitive Form 維持の理由と再検討トリガー、運用形態）は `docs/distribution-policy.md` を参照。

### marketplace.json の規約

`.claude-plugin/marketplace.json` は Claude Code の install 単位（plugin＝スキルの束）と、Vercel `skills` のインタラクティブ UI のグループ表示を**両方**決める。skills CLI も同ファイルを読むため、片方専用の設定にはできない。

フィールドの仕様と上流ドキュメントの参照先は `docs/distribution-policy.md`「上流仕様の参照先」にまとめてある（公式に記述がなく実測でしか確定できない挙動も併記）。

- **plugin 名は不変の識別子**。`/plugin install`・`enabledPlugins`・`pluginConfigs` が参照するので、変えると既存インストールが壊れる。表示名だけ変えたいときは `displayName` を足して `name` は据え置く
- **`version` は書かない**。書くとその文字列が変わるまで利用者に更新が届かない（バンプ忘れが配信事故になる）。省略すればコミット SHA 追従になる。スキルの版は frontmatter `metadata.version`、リリースの版は `gh skill publish` のタグが担う
- **`plugin.json` を置かない**。置くとその `name` が全 plugin 共通の表示名になり、marketplace エントリの `description` / `version` が無視される
- **experimental は `description` 冒頭の `(experimental)` で示す**。plugin 名に含めると stable 化のたびにリネーム＝既存インストールの破壊が必要になる。marketplace エントリと該当 `SKILL.md` の**両方**に書く（チャネルごとに表示元が違う）。昇格は両方から prefix を外すだけ

### plugin の廃止手順

1. **非推奨を宣言**（撤去しない）: marketplace の `description` 冒頭に `(deprecated)` と移行先を書く。plugin はカタログに残し、既存利用者は動き続ける
2. **撤去**: `plugins` からエントリを外すと同時に、最上位の `renames` に `"<plugin名>": null` を追加する。黙って消すと利用者は `plugin-not-found` になる。改名の場合は `null` の代わりに新しい名前を書く

`renames` は**追記のみ**。移行が終わったと思っても古いエントリを消さない（Claude Code はチェーンを辿るため、再改名時は書き足す）。編集後は `claude plugin validate .` で循環と終端を検証する。

## Spec-Drift Watch（仕様追従・著者用）

プラットフォーム仕様に結合したスキル（例 `1natsu-document-harness-model`）は、上流の公式ドキュメント進化で陳腐化する。その追従を仕組み化している（非配布・著者関心）:

- `.spec-watch/`: 監視マニフェスト `sources.json` ＋ 差分基準の `snapshots/`。詳細は `.spec-watch/README.md`。
- `.claude/skills/spec-drift-watch` (Internal skill): 検出器。`scripts/check.mjs`（依存ゼロ Node）で上流と diff し、変化があればドリフトレポート PR を1本上げる。Cloud Routine から隔週実行する想定。
- `.claude/skills/spec-drift-fix` (Internal skill): 是正役。ドリフト PR をローカル checkout した状態で起動し、上流に追従してスキルを直す（挙動仕様の変化は実測で裏取り）。
