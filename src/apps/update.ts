import { intro, log, outro } from "@clack/prompts";
import chalk from "chalk";
import { confirmForm } from "../forms/common.js";
import {
    chooseDepTypeForm,
    selectPackForm,
    selectRegistryForm,
} from "../forms/update.js";
import { versionType } from "../interface.js";
import { bpManifest, ManifestManager } from "../utils/manifest.js";
import { NpmPackManager, PackWithVersion } from "../utils/npmPack.js";
import { packageJsonManager } from "../utils/package.js";

/**根据选定版本类型和包获取依赖对象 */
export async function getDepsForPacks(
    packs: PackWithVersion[],
    depType: {
        name: string;
        type: versionType;
    }
) {
    const newDeps: Record<string, string> = {};
    for (let pack of packs) {
        const version = pack.version?.[depType.type];
        if (!version) {
            log.error(`${pack.name} 的 ${depType.name} 版本不存在，已跳过`);
            continue;
        }
        newDeps[pack.name] = version;
    }
    return newDeps;
}

export async function updateDeps(deps: Record<string, string>) {
    log.step("写入 package.json");
    packageJsonManager.updateDependencies(deps);
    log.step("写入 manifest.json");
    const depList = ManifestManager.toDepList(deps);
    await bpManifest.update({ dependencies: depList });
}

export async function update() {
    intro("更新sapi版本");
    try {
        const packs = packageJsonManager.getSupportedPackages();
        log.info(`检测到 ${packs.length} 个 Minecraft 包`);
        //选择源
        const registry = await selectRegistryForm();
        const packManager = new NpmPackManager(registry);

        //获取包信息
        log.step(`🌐 从 ${chalk.blue(packManager.registry)} 获取包信息...`);
        const packsWithVersion =
            await packManager.getLatestVersionsForPacks(packs);

        //获取最新依赖
        const depType = await chooseDepTypeForm(packsWithVersion);

        log.info(chalk.blue(`将更新为 ${depType.name}`));
        await confirmForm(`确定要更新到${depType.type}吗?`);

        //选择要更新的包
        const selectedPacks = await selectPackForm(
            packsWithVersion,
            depType.type
        );
        //构造deps对象
        const deps = await getDepsForPacks(selectedPacks, depType);
        //更新依赖
        await updateDeps(deps);

        outro(chalk.green("🎉 所有更新完成！请执行 npm i 更新依赖 "));
    } catch (err) {
        log.error(`更新失败: ${(err as Error).message}`);
    }
}
