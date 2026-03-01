import {
    intro,
    isCancel,
    log,
    multiselect,
    outro,
    select,
    text,
} from "@clack/prompts";
import AdmZip from "adm-zip";
import chalk from "chalk";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { bpManifest } from "../utils/manifest.js";
import { NpmPackManager } from "../utils/npmPack.js";
import { packageJsonManager } from "../utils/package.js";
import { npmRegistries } from "../utils/static.js";
import { updatePackVersion } from "./update.js";

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
        const name = await text({
            message: "请输入行为包名称：",
            validate(value) {
                if (value.trim().length == 0) {
                    return "行为包名不能为空";
                }
            },
        });
        if (isCancel(name)) process.exit(0);
        const description = await text({
            message: "请输入行为包描述：",
            validate(value) {
                if (value.trim().length == 0) {
                    return "描述不能为空";
                }
            },
        });
        if (isCancel(description)) process.exit(0);

        extractZip(buffer, overwrite);
        await updateManifest(name, description);
        await installDependencies();

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
    for (const dep of Object.keys(data.overrides)) {
        if (!keepPacks.includes(dep)) delete data.overrides[dep];
    }
    packageJsonManager.write(data);
}

async function installDependencies() {
    const registry = await select({
        message: "请选择依赖源",
        options: npmRegistries,
        initialValue: npmRegistries[1].value,
    });

    if (isCancel(registry)) {
        process.exit(0);
    }

    const packManager = new NpmPackManager(registry);

    const packs = await multiselect({
        message: "选择要安装的mc包(用空格选择)",
        options: [
            {
                value: "@minecraft/server",
                label: "@minecraft/server",
                hint: "必装",
            },
            {
                value: "@minecraft/server-ui",
                label: "@minecraft/server-ui",
                hint: "表单操作",
            },
            {
                value: "sapi-pro",
                label: "SAPI-Pro",
                hint: "行为包推荐",
            },
        ],
    });

    if (isCancel(packs)) {
        process.exit(0);
    }

    await clearDependencies(packs);
    await updatePackVersion(packs, packManager);

    log.step(chalk.blue("安装依赖中，请稍候..."));

    await packManager.install();
}
