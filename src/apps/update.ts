import {
    confirm,
    intro,
    isCancel,
    log,
    Option,
    outro,
    select,
} from "@clack/prompts";
import chalk from "chalk";
import { packageJsonData, versionType } from "../interface.js";
import { bpManifest } from "../utils/manifest.js";
import { CategorizedVersion, NpmPackManager } from "../utils/npmPack.js";
import { packageJsonManager } from "../utils/package.js";
import { npmRegistries, PackPattern } from "../utils/static.js";

function getBaseVersion(version: string) {
    if (version.includes("preview")) {
        const match = version.match(/^(\d+.\d+.\d+-.*?[^\.]+)/);
        if (!match?.[1]) {
            log.error(`无法获取${version}的版本号`);
            return undefined;
        }
        return match[1];
    }
    if (version.includes("beta")) {
        //如果是beta版本，则直接置为beta
        return "beta";
    }
    const match = version.match(/^([^-]+)/);
    if (!match?.[1]) {
        log.error(`无法获取${version}的版本号`);
        return undefined;
    }
    return match[1];
}

async function updateManifestModules(newDeps: Record<string, string>) {
    log.step("更新 manifest.json");

    const entries = Object.entries(newDeps);
    const deps = entries
        .map(([name, version]) => ({
            module_name: name,
            version: getBaseVersion(version),
        }))
        .filter((d) => d.version != undefined);

    await bpManifest.update({
        dependencies: deps as { module_name: string; version: string }[],
    });
}

/**从package.json中提取有记录的依赖 */
function getRecordedPackages(pkgData: packageJsonData) {
    const recordedPacks = Object.keys(PackPattern);
    return Object.keys(pkgData.dependencies).filter((dep) =>
        recordedPacks.includes(dep)
    );
}

interface PackWithVersion {
    name: string;
    version?: CategorizedVersion;
}

/**获取每个包的最新版本 */
async function fetchLatestVersionsForPacks(
    packs: string[],
    packManager: NpmPackManager
): Promise<PackWithVersion[]> {
    const latestVersions = await Promise.all(
        packs.map(async (name) => {
            const versions = await packManager.getCategorizedVersions(name);
            return { name, version: versions };
        })
    );
    return latestVersions.filter((t) => t.version != undefined);
}

function buildHintSummary(packs: PackWithVersion[], type: versionType): string {
    const available = packs.filter((p) => p.version?.[type]);
    if (!available.length) return "无可用版本";
    return `${available.length} 个包可更新`;
}

/**根据选择的类型得到新的dependencies项s */
async function chooseDepType(packs: PackWithVersion[]) {
    const versionTypes: Option<versionType>[] = [
        {
            label: "最新版",
            value: "latest",
            hint: buildHintSummary(packs, "latest"),
        },
        {
            label: "稳定版",
            value: "stable",
            hint: buildHintSummary(packs, "stable"),
        },
        {
            label: "beta版",
            value: "beta",
            hint: buildHintSummary(packs, "beta"),
        },
    ];
    const selectedType = await select<versionType>({
        message: "选择要更新的版本类型",
        options: versionTypes,
        initialValue: "beta",
    });

    if (typeof selectedType === "symbol") {
        process.exit(0);
    }

    const selectedLabel =
        versionTypes.find((t) => t.value === selectedType)?.label ??
        selectedType;
    log.info(chalk.blue(`将更新为 ${selectedLabel} ：`));

    for (const p of packs) {
        log.message(
            ` • ${p.name} ${chalk.gray(
                p.version?.[selectedType] ?? "版本不存在"
            )}`
        );
    }

    const shouldUp = await confirm({
        message: `确认更新到${selectedLabel}吗?`,
    });

    if (isCancel(shouldUp) || !shouldUp) {
        process.exit();
    }

    const newDeps = Object.fromEntries(
        packs
            .filter((p) => {
                if (!p.version?.[selectedType]) {
                    log.error(
                        `${p.name} 的 ${selectedLabel} 版本不存在，已跳过`
                    );
                    return false;
                }
                return true;
            })
            .map((p) => [p.name, p.version![selectedType]!])
    );
    return newDeps;
}

export async function updatePackVersion(
    packs: string[],
    packManager: NpmPackManager
) {
    //获取包信息
    log.step(`🌐 从 ${chalk.blue(packManager.registry)} 获取包信息...`);
    const packWithVersions = await fetchLatestVersionsForPacks(
        packs,
        packManager
    );
    //获取新的依赖
    const newDeps = await chooseDepType(packWithVersions);
    //更新依赖
    log.step("更新 package.json");
    packageJsonManager.updateDependencies(newDeps);
    await updateManifestModules(newDeps);
}

export async function update() {
    intro("更新sapi版本");
    try {
        const packageData = packageJsonManager.read();
        const packs = getRecordedPackages(packageData);
        log.info(`检测到 ${packs.length} 个 Minecraft 包`);
        //选择源
        const registry = await select({
            message: "选择依赖源",
            options: npmRegistries,
            initialValue: npmRegistries[1].value,
        });
        if (isCancel(registry)) {
            process.exit(0);
        }
        const packManager = new NpmPackManager(registry);
        await updatePackVersion(packs, packManager);
        outro(chalk.green("🎉 所有更新完成！请执行 npm i 更新依赖 "));
    } catch (err) {
        log.error(`更新失败: ${(err as Error).message}`);
    }
}
