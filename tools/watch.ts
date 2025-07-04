import chalk from "chalk";
import chokidar from "chokidar";
import { main, runBuild } from "./build.js";
import { formatTime } from "./func.js";

//构建状态
const isBuilding = { value: false };

const watcher = chokidar.watch("src", { ignoreInitial: true });

// 启动监听源代码
watcher.on("change", (filePath) => {
    if (isBuilding.value) {
        return;
    }
    process.stdout.write("\x1Bc"); //清空终端
    console.log(`${formatTime()} ${chalk.yellow("[变更]")} ${filePath}`);
    runBuild(isBuilding);
});

process.stdout.write("\x1Bc"); //清空终端
// 启动构建
main();
