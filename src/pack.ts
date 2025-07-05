import AdmZip from "adm-zip";
import chalk from "chalk";
import { existsSync, rmSync } from "fs";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { copyFiles } from "./copy.js";
import { formatTime, getManifestData, loadConfig } from "./func.js";

const packRoot = "./build";

export async function runPack() {
    console.log(`${formatTime()} ${chalk.blue("打包开始...")}`);
    const config = await loadConfig();
    //获取manifest信息
    const manifestData = getManifestData();
    if (existsSync(packRoot)) {
        await rm(packRoot, { recursive: true });
    }
    const tempPath = path.join(packRoot, "temp");
    await mkdir(packRoot);
    await copyFiles("./", tempPath, true);
    //创建.mcpack
    const zip = new AdmZip();
    zip.addLocalFolder(tempPath);
    let name = config.packageName ? config.packageName : `${manifestData.header.name}`;
    if (config.includeVersionInName) {
        name = name + manifestData.header.version.join(config.useCommaStyleVersion ? "," : ".");
    }
    const packPath = path.join(packRoot, `${name}.mcpack`);
    console.log(chalk.gray(`生成打包文件: ${packPath}`));
    zip.writeZip(packPath);
    //清理temp
    rmSync(tempPath, { recursive: true });
    //创建.zip
    if (config.enableExtraZip) {
        const extraZipPath = path.join(packRoot, `${name}.zip`);
        const extraZip = new AdmZip();
        extraZip.addLocalFile(packPath);
        console.log(chalk.gray(`生成压缩包: ${extraZipPath}`));
        extraZip.writeZip(extraZipPath);
    }
    console.log(`${formatTime()} ${chalk.greenBright(`打包完成,输出路径: ${packRoot}`)}`);
}
