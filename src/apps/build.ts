//这是构建脚本 npm run build
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import chalk from "chalk";
import { exec } from "child_process";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";
import { rollup, RollupCache } from "rollup";
import { setTimeout } from "timers/promises";
import { replaceTscAliasPaths } from "tsc-alias";
import { packType } from "../interface.js";
import { ConfigManager } from "../utils/config.js";
import { TSCError } from "../utils/errors.js";
import { formatTime } from "../utils/func.js";
import { copyToGame } from "./copy.js";

//build主函数
export async function runBuild(
    isBuilding: { value: boolean },
    isClearCache = true,
    rollupCache?: { value?: RollupCache }
) {
    isBuilding.value = true;

    const startTime = Date.now();
    const outPutDir = await ConfigManager.getPackPath(packType.BP, "scripts");

    console.log(`${formatTime()} ${chalk.cyanBright("构建开始")} 🚀`);
    try {
        const config = await ConfigManager.get();
        //编译
        console.log(
            `${formatTime()} ${chalk.blue("[TS]")} 编译 TypeScript... ${config.useTsGo ? chalk.yellow("(TSGO)") : ""}`
        );
        await compileTS(config.useNpx ?? false, config.useTsGo ?? false);
        console.log(`${formatTime()} ${chalk.greenBright("[TS]")} 编译完成`);
        //替换路径
        await replaceTscAliasPaths();
        console.log(
            `${formatTime()} ${chalk.blueBright("[tsc-alias]")} 路径替换完成`
        );
        //清理scripts
        if (config.shouldClearOutput && existsSync(outPutDir)) {
            console.log(
                `${formatTime()} ${chalk.yellow("[清理]")} 删除scripts目录...`
            );
            await safeDelete(outPutDir, 4);
        }
        //打包
        console.log(`${formatTime()} ${chalk.blue("[Rollup]")} 开始打包...`);
        const entry = path.join(config.cacheDir, config.entryPoint);
        if (!existsSync(entry)) {
            throw new Error("入口文件不存在: " + entry);
        }
        const bundle = await rollup({
            input: entry,
            plugins: [
                resolve(),
                commonjs({
                    include: /node_modules/,
                }),
            ],
            //排除
            external: [
                /^@minecraft\/server.*/,
                "@minecraft/common",
                "@minecraft/debug-utilities",
                "@minecraft/diagnostics",
            ],
            onwarn(warning, warn) {
                if (warning.code === "CIRCULAR_DEPENDENCY") return;
                warn(warning);
            },
            cache: rollupCache?.value,
        });

        await bundle.write({
            dir: outPutDir,
            format: "es",
            preserveModules: true,
            preserveModulesRoot: config.cacheDir,
        });
        //保存cache
        if (rollupCache != undefined) {
            rollupCache.value = bundle.cache;
        }

        await bundle.close();
        console.log(
            `${formatTime()} ${chalk.greenBright("[Rollup]")} 打包完成 ✔️`
        );

        //拷贝到游戏目录
        if (config.shouldCopyToGame) await copyToGame();

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(
            `${formatTime()} ${chalk.greenBright(
                "构建完成"
            )} 🎉 用时 ${chalk.bold(`${totalTime}s`)}`
        );
    } catch (err) {
        console.error(`${formatTime()} ${chalk.redBright("构建失败 ❌")}`);
        if (!(err instanceof TSCError) && err instanceof Error) {
            console.error(chalk.red(err.stack || err.message));
        }
    }
    //清理cache
    if (isClearCache) {
        clearCache();
    }

    isBuilding.value = false;
}

function compileTS(usenpx: boolean, useTsGo: boolean) {
    return new Promise((resolve, reject) => {
        const compiler = useTsGo ? "tsgo" : "tsc";
        const cmd = exec(usenpx ? `npx ${compiler}` : compiler);

        // 捕获命令不存在或 spawn 失败
        cmd.on("error", (err: any) => {
            if (err.code === "ENOENT") {
                reject(
                    new TSCError(
                        `typescript未安装或环境变量错误,请使用npm i -g typescript安装"`
                    )
                );
            } else {
                reject(new TSCError(`执行命令失败: ${err.message}`));
            }
        });

        cmd.stdout?.on("data", (data) => process.stdout.write(data));
        cmd.stderr?.on("data", (data) => process.stderr.write(data));

        cmd.on("exit", (code) => {
            if (code === 0) resolve(1);
            else reject(new TSCError(`tsc exited with code ${code}`));
        });
    });
}

async function safeDelete(dir: string, retries = 10, delayMs = 300) {
    for (let i = 0; i < retries; i++) {
        try {
            if (existsSync(dir)) {
                await rm(dir, { recursive: true, force: true });
            }
            return;
        } catch (e: any) {
            if (i === retries - 1) throw e;
            if (
                e.code === "EBUSY" ||
                e.code === "EPERM" ||
                e.code === "ENOTEMPTY"
            ) {
                console.warn(
                    `${formatTime()} ${chalk.gray(
                        `文件被占用，重试第 ${i + 1} 次...`
                    )}`
                );
                await setTimeout(delayMs);
            } else {
                throw e;
            }
        }
    }
}

export async function clearCache() {
    console.log(`${formatTime()} ${chalk.yellow("[清理]")} 清理缓存目录...`);
    const config = await ConfigManager.get();
    return safeDelete(config.cacheDir, 3);
}

export async function buildMain(
    isBuilding: { value: boolean },
    isClearCache = true
) {
    await clearCache();
    // 启动构建
    runBuild(isBuilding, isClearCache);
}
