import chalk from "chalk";
import { existsSync, lstatSync } from "fs";
import { cp, mkdir, rm } from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../toolconfig";
import { formatTime, getManifestData } from "./func";

const __filename = fileURLToPath(import.meta.url);
const files = [
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
];
export async function copyFiles(root: string, dest: string, showDetail = false) {
    if (!existsSync(root)) {
        throw Error("[复制]root目录不存在");
    }
    if (existsSync(dest)) {
        await rm(dest, { recursive: true, force: true });
        await mkdir(dest);
    } else {
        await mkdir(dest);
    }
    await Promise.all(
        files.map((file) => {
            const source = path.join(root, file);
            if (existsSync(source)) {
                const target = path.join(dest, file);
                if (showDetail) {
                    const stat = lstatSync(source);
                    console.log(chalk.gray(`复制${stat.isFile() ? "文件" : "文件夹"}:${file} -> 目标目录/${file}`));
                }
                return cp(source, target, {
                    recursive: true,
                });
            }
            return Promise.resolve();
        })
    );
}

export async function copy2Game() {
    let bpFolderPath: string;
    if (!config.gamePathMode || !config.customGameRoot) throw new Error("拷贝路径配置错误");
    //获取游戏目录
    if (config.gamePathMode === "win") {
        bpFolderPath = `C:/Users/${
            os.userInfo().username
        }/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs`;
    } else {
        bpFolderPath = path.join(config.customGameRoot, "development_behavior_packs");
    }
    if (!existsSync(bpFolderPath)) {
        throw new Error("[复制]development_behavior_packs目录不存在");
    }
    //获取最终目录
    let dest: string;
    if (!config.behaviorPackFolderName) {
        const data = getManifestData();
        dest = path.join(bpFolderPath, data.header.uuid);
    } else {
        dest = path.join(bpFolderPath, config.behaviorPackFolderName);
    }
    console.log(`${formatTime()} ${chalk.magenta("[复制]")}目标目录: ${dest}`);
    await copyFiles("./", dest, false);
    console.log(`${formatTime()} ${chalk.magenta("[复制]")}复制完成`);
}

if (process.argv[1] === __filename) {
    copy2Game();
}
