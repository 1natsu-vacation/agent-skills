# マージ前に配布物を実機で確かめる

互換チャネル（Vercel `skills` / apm / Claude Code plugin）はいずれもデフォルトブランチを追従するため、**main へのマージが実質の公開**になる。壊れた状態を配らないよう、チャネルの動作確認はブランチのまま済ませる。

段階は2つ。**push 前**はローカルパスを直接読ませ（commit していない変更も確認できる）、**push 後**は `#<ref>` でブランチを取得させて GitHub 経由の経路まで再現する。

## 一時ディレクトリの作り方

検証は使い捨てディレクトリで行う。`mktemp -d` を引数なしで呼ぶと `$TMPDIR` ではなく `/var/folders/...` 側を使うため、サンドボックス下のエージェントが実行すると `Operation not permitted` で落ちる。**テンプレートを明示する**。

```bash
D=$(mktemp -d "$TMPDIR/verify.XXXXXX")
```

## push 前 — ローカルパスを読ませる

### Vercel `skills`（一覧だけ見る）

```bash
bunx skills add . --list
```

インストールせずに plugin のグループ分け・スキル名・description を表示する。`.claude-plugin/marketplace.json` を編集したらまずこれを見る。Internal skill（`metadata.internal: true`）が隠れていることもここで分かる。

### Vercel `skills`（実際に配置まで見る）

```bash
D=$(mktemp -d "$TMPDIR/skills-verify.XXXXXX")
cd "$D" && bunx skills add /path/to/agent-skills -p -y --skill 1natsu-hunk
find "$D" -maxdepth 4
```

`-p`（プロジェクトスコープ）が要点で、cwd 配下にしか書き込まない。実体は `.agents/skills/<name>/` に置かれ、`.claude/skills/<name>` はそこへの symlink になる。`skills-lock.json` も cwd に作られる。

**`-g` を付けないこと。** グローバルスコープは自分の `~/.claude/skills/` を書き換えるので検証には使わない。

### Claude Code plugin

`CLAUDE_CONFIG_DIR` を使い捨てに切り替えると、自分の `/plugin` 設定を汚さずにインストールまで試せる。

```bash
CFG=$(mktemp -d "$TMPDIR/cfg.XXXXXX")
CLAUDE_CONFIG_DIR=$CFG claude plugin marketplace add /path/to/agent-skills
CLAUDE_CONFIG_DIR=$CFG claude plugin install 1natsu-hunk@1natsu --scope user
CLAUDE_CONFIG_DIR=$CFG claude plugin details 1natsu-hunk@1natsu
```

`details` で見るのは、**その plugin に入るスキルが意図どおりか**（束の切り方）と、**description が表示されるか**（`(experimental)` prefix が出るか）の2点。

注意:

- `CLAUDE_CONFIG_DIR` を切らないと、marketplace とプラグインが自分の user settings に登録されたまま残る
- `marketplace add` に渡すのはリポジトリのルート。`@` の右に来る marketplace 名は `marketplace.json` の `name`（このリポジトリでは `1natsu`）で、リポジトリ名ではない
- ローカルパスからの `install` はリポジトリ全体を scandir する。エージェントのサンドボックスが読めないパス（`.entire/` 等）があると `EPERM: operation not permitted` で失敗するので、その1コマンドだけサンドボックス外で実行する

## push 後 — `#<ref>` でブランチを取得させる

3チャネルとも ref 指定に対応する。スラッシュを含むブランチ名（`feat/xxx`）もそのまま渡せる。

```bash
# Vercel skills
bunx skills add "1natsu-vacation/agent-skills#<branch>" --list

# Claude Code plugin（git URL 形式で渡す。owner/repo 短縮形ではない）
CFG=$(mktemp -d "$TMPDIR/cfg.XXXXXX")
CLAUDE_CONFIG_DIR=$CFG claude plugin marketplace add "https://github.com/1natsu-vacation/agent-skills.git#<branch>"
CLAUDE_CONFIG_DIR=$CFG claude plugin install 1natsu-hunk@1natsu --scope user

# apm（--target が必須。省略するとインストールが中断する）
D=$(mktemp -d "$TMPDIR/apm-verify.XXXXXX")
cd "$D" && apm install "1natsu-vacation/agent-skills#<branch>" --skill 1natsu-hunk --target claude
```

**apm は必ず使い捨てディレクトリで実行する。** cwd に `apm_modules/` を作り、`.gitignore` にその行を自動追記する。リポジトリ内で走らせると作業ツリーが汚れる。

## 静的検証

```bash
gh skill publish --dry-run .   # Agent Skills 仕様（name とディレクトリの一致、必須 frontmatter 等）
claude plugin validate .       # marketplace.json のスキーマ、renames の循環・終端
```

どちらも `.claude-plugin/marketplace.json` と `skills/` の**対応**は見ないので、登録漏れは別途確認する（コマンドは `.claude/skills/publish-this-repo` の Step 2b）。

## 後片付け

使い捨てディレクトリと `CLAUDE_CONFIG_DIR` を削除する。Claude Code 側は cache も `$CFG` 配下にあるので、ディレクトリごと消せば残らない。
