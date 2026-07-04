## Spec-Drift Report — 2026-07-04

2 changed / 0 errored

実行日: 2026-07-04 (UTC)  
スクリプト: `node .claude/skills/spec-drift-watch/scripts/check.mjs`  
結果: 2 changed, 1 unchanged, 0 errored, 0 maybe-moved

---

### 変化サマリー

| 種別 | 対象 | 要約 | 追従スキル | 影響判定 | 推奨アクション |
|------|------|------|-----------|----------|---------------|
| index | claude-code-docs-index | +22/-5。新ページ17件追加（gateway×6、desktop-linux、feature-availability、gateways、llm-gateway×3、artifacts、plugin-relevance、whats-new×4）、既存エントリ説明更新（chrome beta 外し、--remote→--cloud、Google Vertex AI→Google Cloud's Agent Platform ブランディング変更） | — | 影響なし: いずれもハーネスロード挙動に無関係（gateway/インフラ/インストール/機能比較/週次 changelog） | sources.json 追加なし。snapshot 更新済み（確認済み記録） |
| doc | claude-code-memory | +3/-1。①`@import` バックティック・エスケープ新仕様（コードスパン/フェンスドブロック内の `@path` は import されない）②path-scoped rules のシンボリックリンクパスマッチ追加（v2.1.198〜） | skills/1natsu-document-harness-model | **影響あり**: ①スキルの `@` インポート記述が「バックティックで無効化できる」新動作を未文書（SKILL.md の CLAUDE.md セクション、placement-guide の `@path` 説明）②symlink 経由でのパスマッチがルール条件ロードに影響する新動作も未記述 | `spec-drift-fix` で `1natsu-document-harness-model` を更新: ①CLAUDE.md セクション・placement-guide に「バックティックで `@path` を literal 参照できる」を追記。②rules セクションに「v2.1.198 以降、symlink 経由のパスもマッチ」を追記 |
| doc | claude-code-large-codebases | 変化なし | skills/1natsu-document-harness-model | 影響なし | snapshot 更新のみ（確認済み記録） |

---

### 新ページ relevance 判定詳細（index 変化分）

新規追加17件を全件確認した。いずれも `1natsu-document-harness-model` の守備範囲（CLAUDE.md/`.claude/rules/`/auto memory のロード挙動、`@import`、`paths` スコープ、コンテキスト経済）には関係しない：

| ページ | 概要 | 判定 |
|--------|------|------|
| `artifacts.md` | Artifact レンダリング（HTML ページ生成） | 関係なし |
| `claude-apps-gateway.md` | エンタープライズ gateway（Bedrock/GCP/Azure 等） | 関係なし |
| `claude-apps-gateway-config.md` | gateway.yaml リファレンス | 関係なし |
| `claude-apps-gateway-deploy.md` | gateway デプロイ手順 | 関係なし |
| `claude-apps-gateway-on-gcp.md` | GCP 上の gateway | 関係なし |
| `claude-apps-gateway-spend-limits.md` | gateway スペンド制限 | 関係なし |
| `desktop-linux.md` | Linux デスクトップアプリインストール | 関係なし |
| `feature-availability.md` | プラン別機能比較表（skills/CLAUDE.md 等を列挙するが、ロード挙動の定義ではない） | 関係なし（参考情報のみ） |
| `gateways.md` | gateway ルーティング概要 | 関係なし |
| `llm-gateway-connect.md` | gateway 接続手順 | 関係なし |
| `llm-gateway-protocol.md` | gateway API 仕様 | 関係なし |
| `llm-gateway-rollout.md` | 組織での gateway 展開 | 関係なし |
| `plugin-relevance.md` | marketplace プラグインの `relevance` ブロック設定（管理者向け）。プラグイン推奨機構でありハーネスロード挙動とは別 | 関係なし |
| `whats-new/2026-w23〜w26.md` | 週次 changelog | 関係なし |

→ **sources.json への追加なし**（harness ロード挙動に直接関係する新仕様は含まれていない）

---

### doc ドリフト詳細（claude-code-memory）

#### 変化①: `@import` バックティック・エスケープ（新仕様）

**上流に追加されたテキスト:**
> Import parsing skips Markdown code spans and fenced code blocks. To mention a path in your CLAUDE.md without importing it, wrap it in backticks: writing `` `@README` `` keeps the text literal, while `@README` outside backticks imports the file.

**影響箇所（`skills/1natsu-document-harness-model`）:**

- `SKILL.md` の「CLAUDE.md」セクション（`@path` インポートの説明部分）:  
  現状「`@path` インポートは起動時にフルロードされ」「`@` ではなくプレーンポインタを使う」と説明しているが、「CLAUDE.md 内で `@path` 構文を説明文として書きたい場合はバックティックで囲む（そうしないと実際に import が発動する）」という注意が欠落している。スキルを読んだ著者が naive に `@README` を説明文として書くと意図せず import が起きるリスクがある。
- `references/placement-guide.md` の「ロードタイミング早見表」`@path` インポート行:  
  「起動時にフルロード（節約不可・整理目的）」とあるが、バックティックによる無効化の注記がない。

**判定: 影響あり（追記不足）**  
スキル本体の既存説明は不正ではないが、新動作（バックティック literal 化）を未文書。CLAUDE.md の使い方を教えるスキルとして、著者が `@path` を誤って invoke しないための安全情報が欠ける。

#### 変化②: Path-scoped rules のシンボリックリンクパスマッチ（v2.1.198〜）

**上流変更:**
> （旧）Rules without a `paths` field are loaded unconditionally and apply to all files. Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use.  
> （新）…Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use. {/* min-version: 2.1.198 */}As of v2.1.198, matching also works when Claude reaches a file through a symlinked path to the project directory, for example in a symlinked checkout.

**影響箇所（`skills/1natsu-document-harness-model`）:**

- `SKILL.md` の `.claude/rules/` セクション:  
  「Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use.」と説明しているが、symlink 経由のマッチ対応（v2.1.198〜）を未記述。
- `references/placement-guide.md` のネスト rules・glob 解決セクション:  
  symlink 経由のパスでもマッチするという補足がない。

**判定: 影響あり（軽微・追記不足）**  
既存の説明は不正ではない（symlink でもパターンマッチが機能するようになったという能力追加）。ただし monorepo での symlinked checkout を使うユーザーにとっては動作変化。バージョン注記（v2.1.198〜）付きで追記が望ましい。

---

### 次アクション

**実ドリフトが確認されたため、このブランチをローカルで checkout して `spec-drift-fix` を起動し是正してください。**

是正スコープ（`1natsu-document-harness-model` のみ。スキル本体は今回の PR には含めない）:

1. `skills/1natsu-document-harness-model/SKILL.md`
   - CLAUDE.md セクションの `@path` 説明にバックティック literal 化の注記を追加
2. `skills/1natsu-document-harness-model/references/placement-guide.md`
   - `@path` インポート行にバックティック無効化の注記を追加
   - rules/glob 解決セクションに「v2.1.198〜、symlink 経由のパスもマッチ」を追記

是正後、スキルの `metadata.version` を bump する（`spec-drift-fix` の責務）。

---

*このレポートは `spec-drift-watch` スキルが自動生成しました（検出専用・是正なし）。*
