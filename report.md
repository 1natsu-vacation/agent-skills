## Spec-Drift Report — 2026-06-15

3 changed / 0 errored

| 種別 | 対象 | 要約 | 追従スキル | 影響判定 | 推奨アクション |
|------|------|------|-----------|----------|---------------|
| index | claude-code-docs-index | 新ページ `advisor.md`（advisor tool: メインモデルに stronger advisor を組み合わせる機能）追加。`zero-data-retention.md` の説明文が微修正（"available to qualified accounts on Claude for Enterprise" 追記） | — | 関連なし: advisor tool はエージェント動作の拡張であり CLAUDE.md / rules / memory / skills の配置・ロード挙動（harness model の守備範囲）と無関係。ZDR の説明文変更も同様 | `sources.json` に追加しない（判断記録としてここに残す） |
| doc | claude-code-memory | +1/-1。アンカーリンクの URL エンコーディング修正のみ（`#view-and-edit-with-memory` → `#view-and-edit-with-%2Fmemory`）。ドキュメントの意味・内容に変化なし | 1natsu-document-harness-model | 影響なし: スキルは auto memory のパス `~/.claude/projects/<project>/memory/` を参照するが、変化したアンカーは対象外。意味的変化ゼロ | snapshot 更新のみ（確認済み記録） |
| doc | claude-code-large-codebases | +1/-1。`.claude/settings.local.json` の gitignore 挙動の補足説明が変化。旧: "which is gitignored and not committed"（常に gitignore 済みの印象）→ 新: "Claude Code gitignores that file when it creates it; since you're creating it by hand here, add it to your gitignore."（Claude が作成した場合は自動 gitignore、手動作成の場合は手動追加が必要、と明確化） | 1natsu-document-harness-model | 影響なし: スキルは `settings.local.json` を直接言及しない。スキルの守備範囲はハーネスドキュメント（CLAUDE.md / `.claude/rules/` / docs / feature README）の配置・粒度・内容で、設定ファイルの gitignore 挙動は対象外 | snapshot 更新のみ（確認済み記録） |

---

実ドリフト（スキル是正が必要な変化）はありませんでした。全行が「影響なし」の空振りです。ただし snapshot を進めることで「2026-06-15 時点の上流を確認済み」という監査痕跡になります。そのままマージしてください。

このブランチを checkout して `spec-drift-fix` を起動する必要はありません。
