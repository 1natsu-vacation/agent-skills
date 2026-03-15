import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

// スキルのバリデーションスクリプト
const SKILLS_DIR = join(__dirname, "..", "skills");

interface SkillFrontmatter {
  name: string;
  description: string;
  license: string;
  metadata: {
    author: string;
    version: string;
  };
}

function validateSkill(skillDir: string): boolean {
  const skillPath = join(SKILLS_DIR, skillDir, "SKILL.md");

  if (!existsSync(skillPath)) {
    console.log(`SKILL.md not found: ${skillPath}`);
    return false;
  }

  const content = readFileSync(skillPath, "utf-8");
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    console.log(`No frontmatter found in ${skillDir}`);
    return false;
  }

  const frontmatter = parse(frontmatterMatch[1]);

  if (!frontmatter || typeof frontmatter !== "object") {
    console.log(`Invalid frontmatter structure in ${skillDir}`);
    return false;
  }

  if (typeof frontmatter.name !== "string") {
    console.log(`Missing or invalid 'name' field in ${skillDir}`);
    return false;
  }

  if (typeof frontmatter.description !== "string") {
    console.log(`Missing or invalid 'description' field in ${skillDir}`);
    return false;
  }

  // ディレクトリ名とname一致チェック
  if (frontmatter.name !== skillDir) {
    console.log(
      `Name mismatch: dir=${skillDir}, name=${frontmatter.name}`
    );
    return false;
  }

  // prefixチェック
  const pfx = "1natsu-";
  if (!frontmatter.name.startsWith(pfx)) {
    console.log(`Missing prefix: ${frontmatter.name}`);
    return false;
  }

  // descriptionの存在チェック
  if (!frontmatter.description || frontmatter.description.length === 0) {
    console.log(`Empty description: ${skillDir}`);
    return false;
  }

  return true;
}

function main() {
  const { readdirSync } = require("fs");
  const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry: { isDirectory: () => boolean }) => entry.isDirectory())
    .map((entry: { name: string }) => entry.name);

  let allValid = true;
  for (const dir of dirs) {
    const isValid = validateSkill(dir);
    if (!isValid) {
      allValid = false;
    }
  }

  if (allValid) {
    console.log("All skills are valid!");
  } else {
    console.log("Some skills have validation errors.");
    process.exit(1);
  }
}

main();
