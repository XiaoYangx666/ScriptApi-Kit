//这是构建脚本 npm run build
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import chalk from "chalk";
import { exec, execSync } from "child_process";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";
import { rollup } from "rollup";
import { setTimeout } from "timers/promises";
import { copy2Game } from "./copy.js";
import { formatTime, loadConfig } from "./func.js";

const inputDir = "./cache/";
const entryFile = path.join(inputDir, "/main.js");
const outputDir = "scripts";

//build主函数
export async function runBuild(isBuilding: { value: boolean }, isClearCache = true) {
    isBuilding.value = true;
    const startTime = Date.now();
    console.log(`${formatTime()} ${chalk.cyanBright("构建开始")} 🚀`);
    try {
        const config = await loadConfig();
        console.log(`${formatTime()} ${chalk.blue("[TS]")} 编译 TypeScript...`);
        await compileTS(config.useNpx ?? false);
        console.log(`${formatTime()} ${chalk.greenBright("[TS]")} 编译完成`);
        if (config.shouldClearOutput && existsSync(outputDir)) {
            console.log(`${formatTime()} ${chalk.yellow("[清理]")} 删除scripts目录...`);
            await safeDelete(outputDir, 4);
        }
        console.log(`${formatTime()} ${chalk.blue("[Rollup]")} 开始打包...`);
        const bundle = await rollup({
            input: entryFile,
            plugins: [
                resolve(),
                commonjs({
                    include: /node_modules/,
                }),
            ],
            external: /^@minecraft.+/,
            onwarn(warning, warn) {
                if (warning.code === "CIRCULAR_DEPENDENCY") return;
                warn(warning);
            },
        });

        await bundle.write({
            dir: outputDir,
            format: "es",
            preserveModules: true,
            preserveModulesRoot: inputDir,
        });

        await bundle.close();
        console.log(`${formatTime()} ${chalk.greenBright("[Rollup]")} 打包完成 ✔️`);

        //拷贝到游戏目录
        if (config.shouldCopyToGame) await copy2Game();

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`${formatTime()} ${chalk.greenBright("构建完成")} 🎉 用时 ${chalk.bold(`${totalTime}s`)}`);
    } catch (err) {
        console.error(`${formatTime()} ${chalk.redBright("构建失败 ❌")}`);
        if (!(err instanceof TSCError)) {
            console.error(chalk.red(err.stack || err.message));
        }
    }

    if (isClearCache) {
        clearCache();
    }

    isBuilding.value = false;
}

class TSCError extends Error {
    constructor(message: string, option?: any) {
        super(message, option);
    }
}

function checkTscAvailable() {
    try {
        execSync("tsc --version", { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

function compileTS(usenpx: boolean) {
    return new Promise((resolve, reject) => {
        const cmd = exec(usenpx ? "npx tsc" : "tsc");

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
        } catch (e) {
            if (i === retries - 1) throw e;
            if (e.code === "EBUSY" || e.code === "EPERM" || e.code === "ENOTEMPTY") {
                console.warn(`${formatTime()} ${chalk.gray(`文件被占用，重试第 ${i + 1} 次...`)}`);
                await setTimeout(delayMs);
            } else {
                throw e;
            }
        }
    }
}

export async function clearCache() {
    console.log(`${formatTime()} ${chalk.yellow("[清理]")} 清理缓存目录...`);
    return safeDelete(inputDir, 3);
}

export async function buildMain(isBuilding: { value: boolean }, isClearCache = true) {
    await clearCache();
    // 启动构建
    if (!checkTscAvailable()) {
        throw new Error("TypeScript未安装或环境变量错误,请使用npm i -g typescript安装");
    }
    runBuild(isBuilding, isClearCache);
}
