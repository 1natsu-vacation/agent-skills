# 配布チャネルの選定判断

このリポジトリの配布形態に関する判断と経緯。チャネルの一覧は [AGENTS.md](../AGENTS.md)「Distribution」、公開手順（ランブック）は `.claude/skills/publish-this-repo` を参照。

## apm は Primitive Form のまま、Package Form 化しない（2026-05 判断、apm 0.8.11 時点）

`skills/1natsu-<name>/SKILL.md` の現行配置のまま、apm の Primitive Form（`apm.yml` 不要、`owner/repo/path` でサブディレクトリ直接 install 可能）として公開する。Package Form 化（ルートに `apm.yml` 追加、`.apm/skills/` への移行）はしない。

理由:

- 本命動機（Closed な Enterprise チームへ一部スキルを `apm.yml` 経由で選択的に展開する）は Primitive Form で満たせる。選択的配布は消費側の `apm.yml` で吸収する
- Package Form のメリット（transitive deps、consumer-side lockfile、security scanning）はすべて消費側で得られ、提供側が持つ意味が薄い
- `.apm/skills/` への移行は Vercel `skills`（`skills/` 配置を期待）との互換を破壊するリスクがある

現行配置は Vercel `skills` / apm Primitive Form / `gh skill publish`（`skills/*/SKILL.md` を検出）の3チャネルの前提を同時に満たしている。

### 再検討トリガー

apm 関連の改修要望が来たら、次の順で検討する:

1. apm の現バージョンを確認する（判断時点の 0.8.11 から進んでいるか）
2. MCP 連携・グローバルインストールが公式に整備されたかを確認する
3. Primitive Form の制約（transitive deps なし等）が消費側で実害になっているかを検証する
4. それでも必要なら、`apm.yml` 追加と `.apm/skills/` 移行を分けて段階導入する（破壊的変更を避ける）

## 公開の運用形態

公開（`gh skill publish` による Release 作成）は手動・ローカル運用で、CI / GitHub Actions は導入していない。Release＋semver タグを公開ゲートにする理由と手順は `.claude/skills/publish-this-repo` を参照。
