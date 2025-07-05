import AdmZip from "adm-zip";
import chalk from "chalk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { input, runCommand } from "./func.js";
import { isManifestData } from "./interface.js";

const templateUrl = "https://gitee.com/ykxyx666_admin/sapi-kit_template/releases/download/latest/output.zip";

const KEY_FILES = ["manifest.json", "package.json", "src"];
export async function init(overwrite: boolean) {
    if (!overwrite) {
        const exists = KEY_FILES.some((file) => existsSync(file));
        if (exists) {
            console.log(chalk.red("项目目录已存在关键文件，要强制覆盖请使用sapi-kit init -f"));
            return;
        }
    }
    try {
        console.log(chalk.cyan("🚀开始初始化项目..."));

        const buffer = await downloadZip(templateUrl);
        const name = await input(chalk.gray("请输入行为包名称："));
        const description = await input(chalk.gray("请输入行为包描述："));

        extractZip(buffer, overwrite);
        updateManifest(name, description);
        await installDependencies();

        console.log(chalk.green("✅ 项目初始化完成"));
    } catch (err) {
        console.error(chalk.red("初始化失败："), err);
    }
}

async function downloadZip(url: string): Promise<Buffer> {
    console.log(chalk.blue("下载模板包中..."));
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`下载失败: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function extractZip(buffer: Buffer, overwrite: boolean) {
    const zip = new AdmZip(buffer);
    zip.extractAllTo("./", overwrite);
}

function updateManifest(name: string, description: string) {
    const filePath = "./manifest.json";
    if (!existsSync(filePath)) {
        throw new Error("manifest.json 不存在，无法更新");
    }

    const content = readFileSync(filePath, "utf-8");
    const manifest = JSON.parse(content);

    if (!isManifestData(manifest)) {
        throw new Error("manifest.json 格式错误");
    }

    manifest.header.uuid = uuidv4();
    manifest.modules[0].uuid = uuidv4();
    if (name) manifest.header.name = name;
    if (description) manifest.header.description = description;

    writeFileSync(filePath, JSON.stringify(manifest, null, 4));
}

async function installDependencies() {
    const registryMap = {
        "1": "https://registry.npmjs.org/",
        "2": "https://registry.npmmirror.com",
    };

    const sourceChoice = await input(chalk.gray("请选择依赖源: 1. 官方(默认) / 2. 国内镜像"));
    const registry = registryMap[sourceChoice.trim() as keyof typeof registryMap] ?? registryMap["1"];

    console.log(chalk.blue(`使用源: ${registry}`));
    console.log(chalk.blue("安装依赖中，请稍候..."));

    await runCommand(`npm install --registry ${registry}`);
}
