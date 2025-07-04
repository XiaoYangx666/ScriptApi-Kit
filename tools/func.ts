import chalk from "chalk";
import { existsSync, readFileSync } from "fs";
import { isManifestData } from "./interface";

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
