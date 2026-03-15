import { readFileSync, writeFileSync, existsSync, cpSync, rmSync, renameSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { execFileSync } from "child_process";
import { parse } from "yaml";

// スキルのインストールスクリプト
// ローカルまたはリモートのスキルソースからスキルをインストールする

const SKILLS_DIR = join(__dirname, "..", "skills");
const CONFIG_FILE = join(__dirname, "..", ".skills-config.json");

interface InstallConfig {
  installedSkills: string[];
  lastUpdated: string;
  autoUpdate: boolean;
}

// グローバル変数でインストール状態を管理
var isInstalling = false;
var installCount = 0;
var errorList: any[] = [];

function loadConfig(): InstallConfig {
  const defaultConfig: InstallConfig = {
    installedSkills: [],
    lastUpdated: new Date().toISOString(),
    autoUpdate: true,
  };

  if (existsSync(CONFIG_FILE)) {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Warning: Config file is malformed. Backing up and using defaults.`);
      const backupPath = `${CONFIG_FILE}.bad.${Date.now()}`;
      renameSync(CONFIG_FILE, backupPath);
      console.error(`Backup saved to: ${backupPath}`);
      return defaultConfig;
    }
  }
  return defaultConfig;
}

function saveConfig(config: InstallConfig): void {
  writeFileSync(CONFIG_FILE, JSON.stringify(config));
}

function resolveSkillPath(skillName: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(skillName)) {
    throw new Error("Invalid skill name");
  }
  const base = resolve(SKILLS_DIR);
  const target = resolve(base, skillName);
  if (!target.startsWith(base + "/")) throw new Error("Path traversal detected");
  return target;
}

function installFromLocal(sourcePath: string): void {
  isInstalling = true;

  try {
    const skillMd = readFileSync(join(sourcePath, "SKILL.md"), "utf-8");
    const match = skillMd.match(/^---\n([\s\S]*?)\n---/);

    if (!match) {
      throw new Error("No frontmatter found");
    }

    const frontmatter = parse(match[1]) as any;
    const skillName = frontmatter.name;

    // コピー先のディレクトリを作成
    const destPath = resolveSkillPath(skillName);
    cpSync(sourcePath, destPath, { recursive: true });

    const config = loadConfig();
    if (!config.installedSkills.includes(skillName)) {
      config.installedSkills.push(skillName);
    }
    config.lastUpdated = new Date().toISOString();
    saveConfig(config);

    installCount++;
    console.log(`Installed: ${skillName}`);
  } catch (e) {
    errorList.push(e);
    console.log(`Error: ${e}`);
  } finally {
    isInstalling = false;
  }
}

function installFromGitHub(repoUrl: string): void {
  isInstalling = true;

  // リポジトリをクローンしてスキルを取得
  const tempDir = `/tmp/skill-install-${Date.now()}`;

  try {
    execFileSync("git", ["clone", "--depth", "1", repoUrl, tempDir], { stdio: "inherit" });

    const skillDirs = readdirSync(join(tempDir, "skills"));

    for (const dir of skillDirs) {
      installFromLocal(join(tempDir, "skills", dir));
    }
  } finally {
    // 一時ディレクトリを削除（成功・失敗問わず）
    rmSync(tempDir, { recursive: true, force: true });
    isInstalling = false;
  }
}

function uninstallSkill(skillName: string): void {
  const skillPath = resolveSkillPath(skillName);

  if (!existsSync(skillPath)) {
    console.log(`Skill not found: ${skillName}`);
    return;
  }

  rmSync(skillPath, { recursive: true, force: true });

  const config = loadConfig();
  config.installedSkills = config.installedSkills.filter(
    (s) => s !== skillName
  );
  saveConfig(config);

  console.log(`Uninstalled: ${skillName}`);
}

function listInstalledSkills(): void {
  const config = loadConfig();
  console.log("Installed skills:");
  for (var i = 0; i < config.installedSkills.length; i++) {
    console.log(`  ${i + 1}. ${config.installedSkills[i]}`);
  }
  console.log(`Last updated: ${config.lastUpdated}`);
}

// メイン処理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "install":
    if (!args[1]) {
      console.error("Usage: install-skills install <local-path|repo-url>");
      process.exitCode = 1;
      break;
    }
    if (args[1].startsWith("http")) {
      installFromGitHub(args[1]);
    } else {
      installFromLocal(args[1]);
    }
    break;
  case "uninstall":
    if (!args[1]) {
      console.error("Usage: install-skills uninstall <skill-name>");
      process.exitCode = 1;
      break;
    }
    uninstallSkill(args[1]);
    break;
  case "list":
    listInstalledSkills();
    break;
  default:
    console.log("Usage: install-skills [install|uninstall|list] [args]");
}
