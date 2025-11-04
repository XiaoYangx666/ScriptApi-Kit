import chalk from "chalk";
import { existsSync, lstatSync, readdirSync } from "fs";
import { cp, mkdir, rm } from "fs/promises";
import os from "os";
import path from "path";
import { formatTime } from "../utils/func.js";
import { packType, sapiKitConfig } from "../interface.js";
import { bpManifest, rpManifest } from "../utils/manifest.js";
import { ConfigManager } from "../utils/config.js";

const bpFiles = new Set([
    "scripts",
    "manifest.json",
    "animation_controllers",
    "animations",
    "biomes",
    "blocks",
    "entities",
    "functions",
    "items",
    "loot_tables",
    "pack_icon.png",
    "recipes",
    "spawn_rules",
    "structures",
    "texts",
    "trading",
    "feature_rules",
    "features",
    "worldgen",
]);

const BPFolderName = "development_behavior_packs";
const RPFolderName = "development_resource_packs";

export async function copyToGame() {
    //尝试加载配置
    const config = await ConfigManager.get();
    // 验证配置
    if (!config.gamePathMode) {
        console.error(
            chalk.red(
                "拷贝路径配置错误：请正确配置 gamePathMode 和 customGameRoot!"
            )
        );
        return;
    }

    // 解析游戏根路径
    const gameRootDir = resolveGameRoot(config);
    if (!gameRootDir) {
        console.error(chalk.red("游戏路径解析失败，请检查配置!"));
        return;
    }

    // 复制行为包与资源包
    await Promise.all([
        config.bpRoot && copyPackFolder(gameRootDir, packType.BP),
        config.rpRoot && copyPackFolder(gameRootDir, packType.RP),
    ]);
    console.log(`${formatTime()} ${chalk.magenta("[复制]")}复制完成`);
}

export function resolveGameRoot(config: sapiKitConfig): string | undefined {
    if (config.gamePathMode === "win") {
        return path.resolve(
            "C:/Users",
            os.userInfo().username,
            "AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang"
        );
    } else if (config.gamePathMode === "custom") {
        if (!config.customGameRoot) {
            return undefined;
        }
        return path.resolve(config.customGameRoot);
    }
}

async function copyPackFolder(gameRootPath: string, packType: packType) {
    const config = await ConfigManager.get();

    const isBP = packType === "bp";
    const rootName = isBP ? BPFolderName : RPFolderName;
    const packRootPath = path.resolve(gameRootPath, rootName);

    if (!existsSync(packRootPath)) {
        throw new Error(`[复制] ${rootName} 目录不存在 : ${packRootPath}`);
    }

    const src = isBP ? config.bpRoot : config.rpRoot;

    if (!src) {
        throw new Error(`[复制] ${isBP ? "行为包" : "资源包"}目录未配置`);
    }
    if (!existsSync(src)) {
        throw new Error(
            `[复制] ${isBP ? "行为包" : "资源包"}目录不存在:  ${src}`
        );
    }

    // 确定目标目录名
    let destDir: string;
    if (
        (isBP && !config.behaviorPackFolderName) ||
        (!isBP && !config.resourcePackFolderName)
    ) {
        const data = await (isBP ? bpManifest.read() : rpManifest.read());
        destDir = path.resolve(packRootPath, data.header.uuid);
    } else {
        const folderName = isBP
            ? config.behaviorPackFolderName!
            : config.resourcePackFolderName!;
        destDir = path.join(packRootPath, folderName);
    }

    console.log(
        `${formatTime()} ${chalk.magenta("[复制]")} ${chalk.grey(
            src
        )} -> ${chalk.grey(destDir)}`
    );
    await copyFiles(src, destDir, false, packType);
}

/**
 * 拷贝行为包/资源包文件到指定目录
 *
 * 行为包只会拷贝部分文件过去
 * @param root 行为包/资源包根目录
 * @param dest 目标目录
 * @param showDetail 是否显示细节
 * @param type 包类型
 */
export async function copyFiles(
    root: string,
    dest: string,
    showDetail = false,
    type: packType
) {
    if (!existsSync(root)) {
        throw Error("[复制]root目录不存在: " + root);
    }
    if (existsSync(dest)) {
        await rm(dest, { recursive: true, force: true });
    }
    await mkdir(dest);
    //得到文件列表
    const filesInDir = new Set(readdirSync(root));
    //如果是BP，只复制部分包
    const filesToCopy = Array.from(
        type == packType.BP ? filesInDir.intersection(bpFiles) : filesInDir
    );

    await Promise.all(
        filesToCopy.map((file) => {
            const source = path.join(root, file);
            const target = path.join(dest, file);
            if (showDetail) {
                const stat = lstatSync(source);
                console.log(
                    chalk.gray(
                        `复制${
                            stat.isFile() ? "文件" : "文件夹"
                        }:${file} -> 目标目录/${file}`
                    )
                );
            }
            return cp(source, target, {
                recursive: true,
            });
        })
    );
}
