import { isCancel, multiselect, select, type Option } from "@clack/prompts";
import chalk from "chalk";
import { versionType } from "../interface";
import { PackWithVersion } from "../utils/npmPack.js";
import { npmRegistries } from "../utils/static.js";

/**选择依赖源表单 */
export async function selectRegistryForm() {
    const registry = await select({
        message: "选择依赖源",
        options: npmRegistries,
        initialValue: npmRegistries[1].value,
    });
    if (isCancel(registry)) {
        process.exit(0);
    }
    return registry;
}

function buildHintSummary(packs: PackWithVersion[], type: versionType): string {
    const available = packs.filter((p) => p.version?.[type]);
    if (!available.length) return "无可用版本";
    return `${available.length} 个包可更新`;
}

/**选择类型表单 */
export async function chooseDepTypeForm(packs: PackWithVersion[]) {
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
        message: "选择版本类型",
        options: versionTypes,
        initialValue: "beta",
    });

    if (typeof selectedType === "symbol") {
        process.exit(0);
    }

    const selectedLabel =
        versionTypes.find((t) => t.value === selectedType)?.label ??
        selectedType;

    return { name: selectedLabel, type: selectedType };
}

export async function selectPackForm(
    packs: PackWithVersion[],
    type: versionType
) {
    const selectedPacks = await multiselect<PackWithVersion>({
        message: "选择要更新的包",
        options: packs.map((p) => ({
            label: `${p.name} ${chalk.gray(p.version?.[type] ?? "版本不存在")}`,
            value: p,
        })),
        initialValues: packs,
    });
    if (typeof selectedPacks === "symbol") {
        process.exit(0);
    }
    return selectedPacks;
}
