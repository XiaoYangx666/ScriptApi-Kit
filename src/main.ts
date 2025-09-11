#!/usr/bin/env node

import { program } from "commander";
import { buildMain } from "./build.js";
import { copy2Game } from "./copy.js";
import { init } from "./init.js";
import { sapiKitConfig } from "./interface.js";
import { runPack } from "./pack.js";
import { update } from "./update.js";
import { runDev } from "./watch.js";

export function defineSapiKitConfig(config: sapiKitConfig) {
    return config;
}

export function cliMain() {
    // 构建行为包
    program
        .command("build")
        .description("构建行为包")
        .action(() => {
            buildMain({ value: false });
        });

    // 打包项目
    program
        .command("pack")
        .description("打包项目")
        .action(() => {
            runPack();
        });

    // 开发模式运行
    program
        .command("dev")
        .description("以开发模式运行")
        .action(() => {
            runDev();
        });

    // 复制资源
    program
        .command("copy")
        .description("复制资源文件")
        .action(() => {
            copy2Game();
        });

    // 更新配置或资源
    program
        .command("update")
        .description("更新配置或依赖资源")
        .action(() => {
            update();
        });

    program
        .command("init")
        .description("初始化项目模板")
        .option("-f, --force", "是否覆盖已有文件")
        .action((options) => {
            init(!!options.force);
        });

    program
        .command("version")
        .description("查看当前版本")
        .action(() => {
            console.log("版本 0.1.7");
        });

    program.parse();
}
