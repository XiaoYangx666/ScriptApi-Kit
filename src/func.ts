import chalk from "chalk";
import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import readline from "readline";
import { pathToFileURL } from "url";
import { isManifestData, sapiKitConfig } from "./interface.js";

// 工具函数：格式化时间
export function formatTime(date = new Date()) {
    return chalk.gray(`[${date.toLocaleTimeString("zh-CN", { hour12: false })}]`);
}

export function getManifestData() {
    const manifestPath = "./manifest.json";
    if (!existsSync(manifestPath)) throw new Error("manifest.json不存在,打包失败");
    const data = readFileSync("./manifest.json", { encoding: "utf-8" });
    try {
        const jsondata = JSON.parse(data);
        if (!isManifestData(jsondata)) {
            throw new Error("aa");
        }
        return jsondata;
    } catch (err) {
        throw new Error("读取manifest.json失败");
    }
}

class ConfigLoadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigLoadError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigLoadError);
        }
    }
}

const defaultConfigPath = "./sapi-kit.config.mjs";
export async function loadConfig(configpath = defaultConfigPath) {
    const configPath = path.resolve("./", configpath);
    const configUrl = pathToFileURL(configPath);
    if (!existsSync(configpath)) {
        throw new ConfigLoadError("配置文件不存在");
    }
    const config = await import(configUrl.href);
    return (config.default || config) as sapiKitConfig;
}

export function input(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) =>
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        })
    );
}

export function runCommand(command: string) {
    return new Promise((resolve, reject) => {
        const cmd = spawn(command, { shell: true, stdio: "inherit" });

        cmd.on("close", (code) => {
            if (code === 0) {
                resolve(1);
            } else {
                reject(new Error(`命令执行失败，退出码: ${code}`));
            }
        });
    });
}
