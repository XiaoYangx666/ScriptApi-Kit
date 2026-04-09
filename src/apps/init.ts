import { intro, log, outro } from "@clack/prompts";
import AdmZip from "adm-zip";
import chalk from "chalk";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { confirmForm } from "../forms/common.js";
import { nameAndDesForm, selectMcPack } from "../forms/init.js";
import { chooseDepTypeForm, selectRegistryForm } from "../forms/update.js";
import { bpManifest } from "../utils/manifest.js";
import { NpmPackManager } from "../utils/npmPack.js";
import { packageJsonManager } from "../utils/package.js";
import { getDepsForPacks, updateDeps } from "./update.js";

const templateUrl =
    "https://gitee.com/ykxyx666_admin/sapi-kit_template/releases/download/latest/output.zip";

const KEY_FILES = ["manifest.json", "package.json", "src"];

export async function init(overwrite: boolean) {
    intro("初始化sapi项目");
    if (!overwrite) {
        const exists = KEY_FILES.some((file) => existsSync(file));
        if (exists) {
            console.log(
                chalk.red(
                    "项目目录已存在关键文件，要强制覆盖请使用sapi-kit init -f"
                )
            );
            return;
        }
    }
    try {
        log.step(chalk.cyan("🚀开始初始化项目..."));

        const buffer = await downloadZip(templateUrl);

        const result = await nameAndDesForm();

        extractZip(buffer, overwrite);
        await updateManifest(result.name, result.description);
        await installDependencies(true);

        outro(chalk.green("✅ 项目初始化完成"));
    } catch (err) {
        log.error(chalk.red("初始化失败"));
        throw err;
    }
}

async function downloadZip(url: string): Promise<Buffer> {
    log.info(chalk.blue("下载模板包中..."));
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

async function updateManifest(name: string, description: string) {
    const manifest = await bpManifest.read();

    manifest.header.uuid = uuidv4();
    manifest.modules[0].uuid = uuidv4();
    if (name) manifest.header.name = name;
    if (description) manifest.header.description = description;

    bpManifest.write(manifest);
}

async function clearDependencies(keepPacks: string[]) {
    const data = packageJsonManager.read();
    if (data.dependencies) {
        for (const dep of Object.keys(data.dependencies)) {
            if (!keepPacks.includes(dep)) delete data.dependencies[dep];
        }
    }
    if (data.overrides) {
        for (const dep of Object.keys(data.overrides)) {
            if (!keepPacks.includes(dep)) delete data.overrides[dep];
        }
    }
    packageJsonManager.write(data);
}

export async function installDependencies(isInit = false) {
    if (!isInit) {
        intro("安装mc依赖");
    }
    //选择源
    const registry = await selectRegistryForm();
    const packManager = new NpmPackManager(registry);
    //选择要安装的包
    const packs = await selectMcPack();

    //清除已有依赖
    if (isInit) {
        await clearDependencies(packs);
    }

    //获取包版本信息
    log.step(`🌐 从 ${chalk.blue(packManager.registry)} 获取包信息...`);
    const packsWithVersion = await packManager.getLatestVersionsForPacks(packs);

    //选择依赖类型
    const depType = await chooseDepTypeForm(packsWithVersion);
    const deps = await getDepsForPacks(packsWithVersion, depType);

    log.info(`将安装 ${depType.name} ：`);

    const list = Object.entries(deps)
        .map(([module, version]) => {
            return `${chalk.cyan(module)}${chalk.gray("@")}${chalk.yellow(version)}`;
        })
        .join("\n");

    log.message(list);
    await confirmForm(`确定安装${depType.name}吗`);

    //更新依赖

    await updateDeps(deps);

    //npm i
    log.step(chalk.blue("安装依赖中，请稍候..."));
    await packManager.install();

    if (!isInit) {
        outro("✅ 安装mc依赖完成");
    }
}
