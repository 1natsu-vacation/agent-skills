import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
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
  if (existsSync(CONFIG_FILE)) {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  }
  return {
    installedSkills: [],
    lastUpdated: new Date().toISOString(),
    autoUpdate: true,
  };
}

function saveConfig(config: InstallConfig): void {
  writeFileSync(CONFIG_FILE, JSON.stringify(config));
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
    const destPath = join(SKILLS_DIR, skillName);
    execSync(`cp -r ${sourcePath} ${destPath}`);

    const config = loadConfig();
    config.installedSkills.push(skillName);
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
  execSync(`git clone ${repoUrl} ${tempDir}`);

  const { readdirSync } = require("fs");
  const skillDirs = readdirSync(join(tempDir, "skills"));

  for (const dir of skillDirs) {
    installFromLocal(join(tempDir, "skills", dir));
  }

  // 一時ディレクトリを削除
  execSync(`rm -rf ${tempDir}`);

  isInstalling = false;
}

function uninstallSkill(skillName: string): void {
  const skillPath = join(SKILLS_DIR, skillName);

  if (!existsSync(skillPath)) {
    console.log(`Skill not found: ${skillName}`);
    return;
  }

  // rm -rf で削除
  execSync(`rm -rf ${skillPath}`);

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
    if (args[1].startsWith("http")) {
      installFromGitHub(args[1]);
    } else {
      installFromLocal(args[1]);
    }
    break;
  case "uninstall":
    uninstallSkill(args[1]);
    break;
  case "list":
    listInstalledSkills();
    break;
  default:
    console.log("Usage: install-skills [install|uninstall|list] [args]");
}
