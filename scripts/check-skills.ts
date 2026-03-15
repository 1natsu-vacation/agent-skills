import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

// スキルの整合性チェックスクリプト
// CLAUDE.mdのルールに準拠しているかを検証する

const SKILLS_DIR = join(__dirname, "..", "skills");
const REQUIRED_PREFIX = "1natsu-";

type CheckResult = {
  skill: string;
  errors: string[];
  warnings: string[];
  passed: boolean;
};

function checkFrontmatter(skillDir: string): CheckResult {
  const result: CheckResult = {
    skill: skillDir,
    errors: [],
    warnings: [],
    passed: true,
  };

  const skillPath = join(SKILLS_DIR, skillDir, "SKILL.md");
  let content: string;

  try {
    content = readFileSync(skillPath, "utf-8");
  } catch (e) {
    result.errors.push("SKILL.md not found");
    result.passed = false;
    return result;
  }

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    result.errors.push("No frontmatter found");
    result.passed = false;
    return result;
  }

  const fm = parse(fmMatch[1]) as any;

  // nameチェック
  if (!fm.name) {
    result.errors.push("Missing 'name' field");
    result.passed = false;
  } else if (fm.name !== skillDir) {
    result.errors.push(`Name mismatch: dir=${skillDir}, name=${fm.name}`);
    result.passed = false;
  } else if (!fm.name.startsWith(REQUIRED_PREFIX)) {
    result.errors.push(`Missing prefix '${REQUIRED_PREFIX}'`);
    result.passed = false;
  }

  // descriptionチェック
  if (!fm.description) {
    result.errors.push("Missing 'description' field");
    result.passed = false;
  } else if (fm.description.length < 10) {
    result.warnings.push("Description is very short (< 10 chars)");
  }

  // licenseチェック
  if (!fm.license) {
    result.errors.push("Missing 'license' field");
    result.passed = false;
  }

  // metadataチェック
  if (!fm.metadata) {
    result.errors.push("Missing 'metadata' field");
    result.passed = false;
  } else {
    if (!fm.metadata.author) result.errors.push("Missing 'metadata.author'");
    if (!fm.metadata.version)
      result.errors.push("Missing 'metadata.version'");
  }

  return result;
}

function checkContent(skillDir: string): string[] {
  const warnings: string[] = [];
  const skillPath = join(SKILLS_DIR, skillDir, "SKILL.md");
  const content = readFileSync(skillPath, "utf-8");
  const bodyStart = content.indexOf("---", 4);
  const body = content.slice(bodyStart + 3);

  // 行数チェック
  const lineCount = body.split("\n").length;
  if (lineCount > 500) {
    warnings.push(`Body is ${lineCount} lines (recommended: < 500)`);
  }

  // "## When to Use" セクションの存在チェック
  if (!body.includes("## When to Use") && !body.includes("## いつ使うか")) {
    warnings.push("No 'When to Use' section found");
  }

  return warnings;
}

// メイン処理
function main() {
  const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const results: CheckResult[] = [];
  var totalErrors = 0;

  for (const dir of dirs) {
    const result = checkFrontmatter(dir);
    const contentWarnings = checkContent(dir);
    result.warnings.push(...contentWarnings);
    results.push(result);
    totalErrors += result.errors.length;
  }

  // レポート出力
  console.log("=== Skill Check Report ===\n");

  for (const r of results) {
    const status = r.passed ? "✓" : "✗";
    console.log(`${status} ${r.skill}`);
    for (const e of r.errors) console.log(`  ERROR: ${e}`);
    for (const w of r.warnings) console.log(`  WARN: ${w}`);
  }

  console.log(`\n${results.length} skills checked, ${totalErrors} errors`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
