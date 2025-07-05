import chalk from "chalk";
import chokidar from "chokidar";
import { clearCache, runBuild } from "./build.js";
import { formatTime } from "./func.js";

//构建状态
const isBuilding = { value: false };

export function runDev() {
    const watcher = chokidar.watch("src", { ignoreInitial: true });

    // 启动监听源代码
    watcher.on("change", (filePath) => {
        if (isBuilding.value) {
            return;
        }
        process.stdout.write("\x1Bc"); //清空终端
        console.log(`${formatTime()} ${chalk.yellow("[变更]")} ${filePath}`);
        runBuild(isBuilding, false);
    });

    process.stdout.write("\x1Bc"); //清空终端
    // 启动构建
    runBuild(isBuilding, false);

    process.on("SIGINT", async () => {
        await clearCache();
        // 做一些清理工作，比如关闭文件、保存状态等
        process.exit(0); // 正常退出
    });
}
