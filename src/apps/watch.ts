import chalk from "chalk";
import chokidar from "chokidar";
import { existsSync } from "fs";
import { RollupCache } from "rollup";
import { ConfigManager } from "../utils/config.js";
import { formatTime, isSubDir } from "../utils/func.js";
import { buildMain, clearCache, runBuild } from "./build.js";
import { copyToGame } from "./copy.js";

//构建状态
const isBuilding = { value: false };
const cache: { value: RollupCache | undefined } = { value: undefined };

export async function runDev() {
    const config = await ConfigManager.get();

    const srcDir = normalizeRelPath(config.srcDir ?? "src");
    const bpRoot = config.bpRoot ? normalizeRelPath(config.bpRoot) : null;
    const rpRoot = config.rpRoot ? normalizeRelPath(config.rpRoot) : null;
    const { shouldCopyToGame } = config;
    // 收集监听路径
    const paths = [srcDir];

    if (shouldCopyToGame) {
        if (bpRoot && existsSync(bpRoot)) {
            paths.push(bpRoot);
        }
        if (rpRoot && existsSync(rpRoot)) {
            paths.push(rpRoot);
        }
    }
    const ignoreDir = bpRoot ? `${bpRoot}/scripts` : null;

    const watcher = chokidar.watch(paths, {
        ignoreInitial: true,
        ignored: ignoreDir
            ? (val) => {
                  const normalized = normalizeRelPath(val);
                  return normalized.startsWith(ignoreDir);
              }
            : undefined,
    });

    // 启动监听源代码
    watcher.on("change", (filePath) => {
        if (isBuilding.value) {
            return;
        }
        process.stdout.write("\x1Bc"); //清空终端
        console.log(`${formatTime()} ${chalk.yellow("[变更]")} ${filePath}`);
        //构建
        if (paths.length == 1 || isSubDir(srcDir, filePath)) {
            withLock(async () => {
                await runBuild(false, false, cache);
            });
        } else if (shouldCopyToGame) {
            //若需要复制则
            const isBp = bpRoot ? isSubDir(bpRoot, filePath) : false;
            const isRp = rpRoot ? isSubDir(rpRoot, filePath) : false;
            const type = isBp ? "bp" : isRp ? "rp" : undefined;
            withLock(async () => {
                await copyToGame(type);
            });
        }
    });

    process.stdout.write("\x1Bc"); //清空终端
    // 启动构建
    buildMain(false, true);

    process.on("SIGINT", async () => {
        await clearCache();
        // 做一些清理工作，比如关闭文件、保存状态等
        process.exit(0); // 正常退出
    });
}

async function withLock(func: () => void | Promise<void>) {
    isBuilding.value = true;
    try {
        await func();
    } catch (err) {
        console.error(`${formatTime()} ${chalk.redBright("失败 ❌")}`);
    }
    isBuilding.value = false;
}

function normalizeRelPath(p: string) {
    return p.replace(/^[.][\\/]/, "");
}
