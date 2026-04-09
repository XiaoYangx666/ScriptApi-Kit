import { cancel, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { spawn } from "child_process";
import path from "path";

// 工具函数：格式化时间
export function formatTime(date = new Date()) {
    return chalk.gray(
        `[${date.toLocaleTimeString("zh-CN", { hour12: false })}]`
    );
}

/**运行指定命令 */
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

/**取消时退出 */
export function exitIfCancel<T>(value: T): Exclude<T, symbol> {
    if (isCancel(value)) {
        cancel("操作已取消");
        process.exit(0);
    }
    return value as Exclude<T, symbol>;
}

