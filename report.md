## Spec-Drift Report — 2026-06-08

| 種別 | 対象 | 要約 | 追従スキル | 影響判定 | 推奨アクション |
|------|------|------|-----------|----------|---------------|
| doc | claude-code-memory | +5/-0。memory.md 冒頭に「各セッションはフレッシュなコンテキストで始まる・2つの持続メカニズム（CLAUDE.md / auto memory）がある」という導入段落が追加された | 1natsu-document-harness-model | 影響なし: スキル L15 の「auto memory との区別」注記が同趣旨を既に正確に記述しており、技術仕様（パス・挙動・frontmatter）の変化なし | snapshot 更新のみ（確認済み記録） |

### 詳細: claude-code-memory の変化

**diff 抜粋:**
```
@@ -6,6 +6,11 @@

 > Give Claude persistent instructions with CLAUDE.md files, and let Claude accumulate learnings automatically with auto memory.

+Each Claude Code session begins with a fresh context window. Two mechanisms carry knowledge across sessions:
+
+* **CLAUDE.md files**: instructions you write to give Claude persistent context
+* **Auto memory**: notes Claude writes itself based on your corrections and preferences
+
 This page covers how to:
```

**判定根拠:**
- 追加された5行はすべて導入的な説明文であり、機能仕様・挙動仕様の変更ではない
- `1natsu-document-harness-model` SKILL.md L15 に「auto memory との区別」として既に `~/.claude/projects/<project>/memory/` パスを含む正確な記述がある
- 追従スキルが記述するロード挙動・配置規則・frontmatter キー・パス解決に影響する記述変化なし

### 次アクション

このブランチをそのままマージして snapshot を進めるだけで OK（スキル是正は不要）。

実ドリフト（影響ありの変化）が今後発生した場合は、このブランチをローカル checkout して `spec-drift-fix` を起動して是正してください。
