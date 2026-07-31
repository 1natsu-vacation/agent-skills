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

### 2026-07-31 時点の再確認（apm 0.26.0、公式ドキュメントのみ）

トリガー1が発火したため現行仕様を確認した。実機検証は未実施。出典は [package-types](https://microsoft.github.io/apm/reference/package-types/) / [targets-matrix](https://microsoft.github.io/apm/reference/targets-matrix/) / [primitives-and-targets](https://microsoft.github.io/apm/concepts/primitives-and-targets/)。

**用語が変わった。** 「Primitive Form」「Package Form」は現行ドキュメントに存在しない。root signal による5つの layout に整理され、このリポジトリは **Skill collection**（`skills/<name>/SKILL.md`、`apm.yml` は任意）に当たる。`owner/repo/path` でサブディレクトリを直接指す経路は **virtual subdirectory** と呼ばれ、今も有効。

**判断理由の1つが成立しなくなった。** 「`apm.yml` の追加は `.apm/skills/` への移行を伴い Vercel `skills` 互換を壊す」は現行仕様では誤り。`skills/` の配置を動かさずルート `apm.yml` だけを追加できる。ディレクトリ移動と `apm.yml` は独立した選択になっている。

**判断時点の情報が古かった。** 0.8.11 は、`skills/<name>/SKILL.md` が第一級形態として明文化された 0.9.4 の直前。正式サポート前の状態で判断していた。

`apm.yml` を持たない配布は現行でも第一級で、非推奨化の記述はない。

#### ルート `apm.yml` は追加しない

消費者の体験を変える要素がほとんどないため、現状維持とする。

- pin と再現性は lockfile の `resolved_commit`（commit SHA）が担う。`apm.yml` は無関係で、`version` は表示用メタデータと明記されている
- バージョン指定は git tag で解決される。`gh skill publish` が作る `vX.Y.Z` は apm が照合するタグパターンに一致するため、消費者は `#v2.4.0` や `#^2.0.0` を `apm.yml` なしで使える
- `apm update` / `apm outdated` の更新検出も git tag / branch tip の比較で、`apm.yml` の version は判定に登場しない
- 発見性を担うのは `apm search` だが、これはマーケットプレイス登録が前提で `apm.yml` では届かない
- `apm publish` は `.apm/` を要求するため、Skill collection のままでは `apm.yml` を足しても使えない

得られるのは実質2つだけ。ひとつは `license:` の宣言で、消費側の SBOM（`apm lock export`）に載る。`apm.yml` がないと CycloneDX は license 欄を省き、SPDX は `NOASSERTION` を書く（SKILL.md 側の `license: MIT` は apm の `declared_license` の出典に含まれない）。もうひとつはインストール済み利用者の `apm view` に name / version / description / author が表示されること。

対するコストは、必須フィールドになる `version` を git tag と手動同期する義務。マーケットプレイスを持たない限り不整合を検出する仕組みがなく、ズレても install・update・outdated のどれにも現れない。`license` と `description` も SKILL.md と二重管理になる。

`.claude-plugin/marketplace.json` を導入したのは利用者の install 単位が実際に変わるからで、`apm.yml` にはそれに当たる実効がない。静かにドリフトするフィールドを増やす方が損になる。

**追加の再検討トリガー**: SBOM に license を要求する消費者が現れたとき。その場合も必要なのは `name` / `version` / `license` / `description` を持つルート `apm.yml` だけで、`.apm/` への移行は不要。

#### frontmatter の ASCII 制約は検証しない

Skill collection の validation rules に "All frontmatter values must be ASCII-only" とあり、全スキルの `description` が日本語なので形式上は抵触する。これは実測しない。`description` はエージェントが発動判断に使う自然言語のフィールドで、そこに ASCII 制約をかけるのは仕様側の設計問題であり、当リポジトリが吸収する責務ではない。

## 公開の運用形態

公開（`gh skill publish` による Release 作成）は手動・ローカル運用で、CI / GitHub Actions は導入していない。Release＋semver タグを公開ゲートにする理由と手順は `.claude/skills/publish-this-repo` を参照。

## Claude Code plugin marketplace を互換チャネルに追加（2026-07-31 判断、Claude Code 2.1.220 / skills CLI 1.5.20 時点）

`.claude-plugin/marketplace.json` を1本だけ置き、スキルを7つの plugin に束ねた。`1natsu-hunk` を experimental として区分すること、Claude Code の利用者が不要なスキルまで一括で入れずに済むことが動機。規約は AGENTS.md「marketplace.json の規約」を参照。

### `plugin.json` との併用を採らない

「`plugin.json` は Vercel `skills` のグループ表示用、`marketplace.json` は Claude Code の install 単位用」とチャネルごとに分ける案は成立しない。

- skills CLI は両方を読み、`marketplace.json` → `plugin.json` の順にグループ割り当てを上書きする
- Claude Code 側は `plugin.json` がコンポーネント定義の権威になり、その `name` が全 plugin 共通の表示名になる。marketplace エントリの `description` / `version` は無視され、`plugin.json` からそれらを削ってもフォールバックしない（実測では全 plugin が同じ名前で表示され、説明が空になった）

install されるスキルの中身は marketplace エントリが決めるので、壊れるのは表示だけではある。ただし `(experimental)` を description で示す方針が使えなくなるため、`plugin.json` は置かない。

### plugin の `version` を書かない

version 解決は `plugin.json` → marketplace エントリ → コミット SHA の順。`version` を書くとその文字列が変わるまで更新が届かないので、バンプを忘れると新版が配られない。

束に複数スキルが入る plugin（`1natsu-document-harness` は3スキル）では、1スキルの更新に対して plugin version をどう振るかの判断が毎回発生し、しかもスキル単位の履歴とは対応しない。スキルの版は frontmatter `metadata.version`、リリースの版は `gh skill publish` のタグ、plugin は配布の束（版は SHA）と役割を分ける。

### experimental を plugin 名に含めない

`-experimental` suffix は stable 化のたびにリネームが必要になる。plugin 名は `enabledPlugins` などが参照する不変の識別子で、リネームは既存インストールの破壊と `renames` による移行を伴う。npm で beta を別モジュール名として公開するのと同じ構造になるため採らない。`description` 冒頭の `(experimental)` で表現し、昇格は prefix を外すだけにする。

`(experimental)` は `marketplace.json` と `skills/<name>/SKILL.md` の両方の description に書く。Claude Code は前者、Vercel `skills` / apm / `gh skill install` は後者を表示するため、片方だけでは印が消えるチャネルが出る。

### リリースブランチ運用を採らない

skills CLI は ref 未指定なら `HEAD`（＝デフォルトブランチ）→ `main` → `master` の順に解決する。リリース軸を別ブランチに置いても、デフォルトブランチが開発軸のままなら Vercel `skills` と apm は未リリース状態を配り続ける。全チャネルをリリース軸に揃えるにはデフォルトブランチ自体を移す必要があり、手間が利得を上回る。

plugin チャネルも既存の互換チャネルと同じデフォルトブランチ追従とし、`gh skill publish` の Release だけが正規リリースという整理を保つ。利用者側でタグ固定したい場合は各インストーラの `#vX.Y.Z` 指定で対応できる。

### 上流仕様の参照先

plugin まわりは公式ドキュメントで辿れる仕様と、実測でしか確定できなかった挙動が混在する。

**ドキュメントで確認できる**

| 参照先 | 確定できること |
|--------|--------------|
| [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) | `marketplace.json` のスキーマ、`source: "./"` を共有する複数エントリを `skills[]` で振り分ける書き方、`strict` mode、`renames` による改名・廃止、version 解決順とリリースチャネル |
| [plugins-reference](https://code.claude.com/docs/en/plugins-reference) | plugin エントリの全フィールド（`displayName` / `category` / `keywords` / `tags` / `defaultEnabled` 等）、各コンポーネントの仕様、`claude plugin` CLI |
| [discover-plugins](https://code.claude.com/docs/en/discover-plugins) | install / enable / disable / uninstall がすべて plugin 単位であること、install scope、`/reload-plugins`、auto-update の既定 |
| [skills](https://code.claude.com/docs/en/skills) | plugin skill の namespace（`plugin-name:skill-name`）、`skillOverrides` による利用者側の可視性制御 |
| [vercel-labs/skills README](https://github.com/vercel-labs/skills/blob/main/README.md) | skills CLI のディスカバリ順、Plugin Manifest Discovery、`metadata.internal` |

**実測でしか確定できない**

上流ドキュメントに記述がないため、変更されても告知を得られない。挙動が怪しくなったら再現方法で確かめ直す。

| 挙動 | 再現方法 |
|------|---------|
| `plugin.json` があると marketplace エントリの `description` / `version` が無視され、`plugin.json` の `name` が全 plugin 共通の表示名になる。`plugin.json` 側でそれらを省いてもフォールバックしない | 使い捨てツリーに両方を置いて `claude plugin details <name>@<marketplace>` |
| skills CLI のグループ名は plugin 名の kebab → Title 変換。未登録スキルは "Other"（`--list` では "General"） | `bunx skills add <path> --list` |
| 同じスキルを複数 plugin に登録でき、skills CLI のグループは marketplace 配列の後勝ち、`plugin.json` がさらに上書きする | 同上 |
| skills CLI の ref 解決は `HEAD`（デフォルトブランチ）→ `main` → `master` の順 | CLI のソース（ref 未指定時のブランチ解決） |

検証は使い捨ての `CLAUDE_CONFIG_DIR` を切って行う。自分の `/plugin` 設定を汚さずに `claude plugin marketplace add` / `install` / `details` を試せる。
