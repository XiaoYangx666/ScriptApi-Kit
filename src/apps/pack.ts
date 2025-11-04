import AdmZip from "adm-zip";
import chalk from "chalk";
import { existsSync, rmSync } from "fs";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { copyFiles } from "./copy.js";
import { formatTime } from "../utils/func.js";
import { packType } from "../interface.js";
import { bpManifest, rpManifest } from "../utils/manifest.js";
import { ConfigManager } from "../utils/config.js";

const packRoot = "./build";
const tempRoot = path.join(packRoot, "temp");

interface genPackInfo {
    tempDir: string;
    name: string;
    packPath: string;
}

export async function runPack() {
    console.log(`${formatTime()} ${chalk.blue("打包开始...")}`);

    if (existsSync(packRoot)) {
        await rm(packRoot, { recursive: true });
    }

    const config = await ConfigManager.get();

    const packTypes: packType[] = [];
    if (config.bpRoot) packTypes.push(packType.BP);
    if (config.rpRoot) packTypes.push(packType.RP);

    if (packTypes.length === 0) {
        throw new Error("没有可打包的资源根目录 (bpRoot 或 rpRoot)");
    }

    if (!config.packageName && packTypes.length > 1) {
        throw new Error("缺少配置项: packageName, 要打包 mcaddon 必须有此字段");
    }

    // 清理并复制文件
    await Promise.all(packTypes.map((t) => copyPackFiles(t)));

    let info: genPackInfo;
    if (packTypes.length === 2) {
        info = {
            tempDir: tempRoot,
            name: config.packageName!,
            packPath: path.join(packRoot, `${config.packageName}.mcaddon`),
        };
    } else {
        info = await genPackInfo(packTypes[0]);
    }

    //打包，生成文件
    createPackFile(info);

    //清理temp
    rmSync(tempRoot, { recursive: true });

    //创建.zip
    if (config.enableExtraZip) {
        await createZip(info);
    }

    console.log(
        `${formatTime()} ${chalk.greenBright(
            `打包完成,输出路径: ${info.packPath}`
        )}`
    );
}

async function copyPackFiles(type: packType) {
    const tempPath = path.join(tempRoot, type);
    await mkdir(tempPath, { recursive: true });
    const packPath = await ConfigManager.getPackPath(type);
    await copyFiles(packPath, tempPath, true, type);
}

async function genPackInfo(type: packType): Promise<genPackInfo> {
    const config = await ConfigManager.get();
    const isBp = type == packType.BP;
    const manifestData = await (isBp ? bpManifest.read() : rpManifest.read());

    const tempDir = path.join(tempRoot, type);
    //获取打包名
    let name = config.packageName
        ? config.packageName
        : `${manifestData.header.name}`;
    if (config.buildName) {
        name = config.buildName(name, manifestData.header.version);
    } else {
        if (config.includeVersionInName) {
            name =
                name +
                manifestData.header.version.join(
                    config.useCommaStyleVersion ? "," : "."
                );
        }
        name += `_${type}`;
    }
    const packPath = path.join(packRoot, `${name}.mcpack`);
    return { tempDir: tempDir, packPath: packPath, name: name };
}

function createPackFile(info: genPackInfo) {
    const zip = new AdmZip();
    zip.addLocalFolder(info.tempDir);
    console.log(chalk.gray(`生成打包文件: ${info.packPath}`));
    zip.writeZip(info.packPath);
}

async function createZip(info: genPackInfo) {
    const extraZipPath = path.join(packRoot, `${info.name}.zip`);
    const extraZip = new AdmZip();
    extraZip.addLocalFile(info.packPath);
    console.log(chalk.gray(`生成压缩包: ${extraZipPath}`));
    extraZip.writeZip(extraZipPath);
}
