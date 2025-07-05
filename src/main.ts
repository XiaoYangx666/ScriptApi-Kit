#!/usr/bin/env node

import { buildMain } from "./build.js";
import { program } from "commander";
import { copy2Game } from "./copy.js";
import { sapiKitConfig } from "./interface.js";
import { runPack } from "./pack.js";
import { update } from "./update.js";
import { runDev } from "./watch.js";
import { init } from "./init.js";

export function defineSapiKitConfig(config: sapiKitConfig) {
    return config;
}

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

program.parse();
