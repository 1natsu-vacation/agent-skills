## Spec-Drift Report — 3 changed / 0 errored (2026-07-15)

実行日: 2026-07-15 (UTC)
スクリプト: `node .claude/skills/spec-drift-watch/scripts/check.mjs`
結果: 3 changed, 0 unchanged, 0 errored

---

### 変化サマリー

| 種別 | 対象 | 要約 | 追従スキル | 影響判定 | 推奨アクション |
|------|------|------|-----------|----------|---------------|
| index | claude-code-docs-index | +5/-1 lines。新ページ2件（`accessibility.md`・`desktop-wsl.md`）、週次 changelog 2件（week27・week28）追加。`artifacts.md` 説明文変更（新ページではない） | — | 影響なし: スクリーンリーダー対応・WSL・changelog はハーネスロード挙動と無関係 | `sources.json` 追加不要。snapshot 更新済み（確認済み記録） |
| doc | claude-code-memory | +5/-5。① `paths` glob で `[` がブラケット式扱いに（無効パターンは no-match、`\[` でエスケープ。v2.1.207+）。② auto memory 最小バージョン注記（v2.1.59+）削除。③ CLAUDE.md 肥大化アドバイスに `/doctor` trim check 追記（v2.1.206+） | 1natsu-document-harness-model | **影響なし**: ①は `placement-guide.md` の glob 節に `[` 構文の言及がないが既存記述を誤らせない追加情報。②は auto memory がスキル対象外。③は「200行以下」方針と矛盾しない新ツール紹介。既存スキル記述が旧情報になるわけではない | snapshot 更新のみ。① `\[` エスケープを将来の placement-guide 補足候補として記録 |
| doc | claude-code-large-codebases | +2/-0。スパース checkout が `extensions.worktreeConfig` を `.git/config` に書く実装詳細と v2.1.207 での cleanup 動作修正（最後の worktree 削除後に設定が残っていたバグ）を追記 | 1natsu-document-harness-model | **影響なし**: スキルは monorepo での CLAUDE.md / rules / skill 配置を扱い、git 内部設定の低レベル挙動は守備範囲外 | snapshot 更新のみ |

---

### インデックス変化の新ページ relevance 判定

| ページ | 概要 | 判定 |
|--------|------|------|
| `accessibility.md` | スクリーンリーダー（VoiceOver・NVDA）設定、縮小・カラーブラインド対応 | 対象外 |
| `desktop-wsl.md` | Windows の WSL 2 ディストリビューション内での Code セッション実行 | 対象外 |
| `whats-new/2026-w27.md` | Sonnet 5 デフォルト化、Claude in Chrome GA、サブエージェント background 実行など | 対象外（changelog） |
| `whats-new/2026-w28.md` | Desktop 内蔵ブラウザ、`/doctor` チェックアップ、auto mode など | 対象外（changelog） |

→ **`sources.json` への追加なし**

---

### doc ドリフト詳細（影響なし行の補足）

#### claude-code-memory ①: `paths` glob の `[` ブラケット式挙動（v2.1.207+）

**上流追加テキスト:**
> Glob syntax treats `[` as the start of a bracket expression such as `[abc]`. A pattern with a `[` that can't be read as a bracket expression, such as `photos [2024/**`, is invalid: it matches nothing, and the rule's other patterns keep working. To match a literal `[` in a file name, escape it as `photos \[2024/**`. Before v2.1.207, one invalid pattern made the Read tool fail for every file the rule was evaluated against, instead of matching nothing.

**スキルへの影響**: `placement-guide.md` の glob 節（L86–97）はディレクトリ基準の解決・symlink 挙動を扱うが、`[` のブラケット式扱いは未記述。ただし既存の記述が**誤りになるわけではない**（追加情報）。  
`\[` によるエスケープ知識は実用的なので、将来の改訂で placement-guide の `paths` 節に補足してもよい。

#### claude-code-memory ③: `/doctor` trim check（v2.1.206+）

**上流追加テキスト:**
> The `/doctor` checkup proposes trims for a checked-in CLAUDE.md: it cuts content Claude can derive from the codebase, such as directory layouts, dependency lists, and architecture overviews, and keeps pitfalls, rationale, and conventions that differ from tool defaults.

**スキルへの影響**: スキルの「200行以下」方針および「書くべきでないもの（コードから直接読み取れること、自明な事実等）」は `/doctor` の trim 基準と一致しており矛盾しない。スキルは具体的なツール名を列挙しない設計なので追記不要。

---

### 次アクション

実ドリフトは **0件**（全行が「影響なし」）のため、スキル本体の是正は不要です。  
このブランチをそのままマージすることで「2026-07-15 まで上流を確認した」監査痕跡になります。

将来の改訂候補（優先度低）:
- `placement-guide.md` の `paths` glob 節に `[` エスケープ（`\[`）の注記を補足

---

*このレポートは `spec-drift-watch` スキルが自動生成しました（検出専用・是正なし）。*
