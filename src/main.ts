#!/usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
import { buildMain } from "./apps//build.js";
import { copyToGame } from "./apps/copy.js";
import { genCmdRouter } from "./apps/gen.js";
import { init, installDependencies } from "./apps/init.js";
import { runPack } from "./apps/pack.js";
import { update } from "./apps/update.js";
import { runDev } from "./apps/watch.js";
import "./gen/index.js";
import { ConfigManager } from "./utils/config.js";

export function cliMain() {
    program.name("sapi-kit").version("0.2.3");

    // 构建行为包
    program
        .command("build")
        .description("构建行为包")
        .action(() => {
            buildMain(true, true);
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
            copyToGame();
        });

    // 更新配置或资源
    program
        .command("update")
        .description("更新配置或依赖资源")
        .action(() => {
            update();
        });

    program
        .command("install")
        .alias("i")
        .description("安装mc依赖")
        .action(() => {
            installDependencies();
        });

    program
        .command("init")
        .description("初始化项目模板")
        .option("-f, --force", "是否覆盖已有文件")
        .action((options) => {
            init(!!options.force);
        });

    program
        .command("check")
        .description("检查当前配置")
        .action(async () => {
            try {
                const messages = await ConfigManager.checkConfig();
                if (messages.length) {
                    console.log(chalk.yellow("⚠ 配置检查警告:"));
                    for (const msg of messages)
                        console.log(" - " + chalk.red(msg));
                    process.exit(1);
                } else {
                    console.log(chalk.green("配置检查通过!"));
                }
            } catch (err) {
                if (err instanceof Error) {
                    console.log(chalk.red(err.message));
                }
            }
        });

    program
        .command("gen [type] [name]") // 👈 改这里
        .alias("g")
        .description("生成文件")
        .action(async (type, name) => {
            // ✅ 没传 type → 直接显示表格
            if (!type) {
                console.log(genCmdRouter.getHelpText());
                return;
            }

            try {
                await genCmdRouter.run(type, name ? [name] : []);
            } catch (err: any) {
                console.error("错误:", err.message);
            }
        });

    program.parse();
}
