import {
    confirm,
    intro,
    multiselect,
    outro,
    select,
    text,
} from "@clack/prompts";
import chalk from "chalk";
import { v4 } from "uuid";
import { genCmdRouter } from "../apps/gen.js";
import { version } from "../interface.js";
import { dependency, manifest, modules } from "../schemas/manifest.js";
import { ConfigManager } from "../utils/config.js";
import { exitIfCancel } from "../utils/func.js";
import { JsonUtil } from "../utils/json.js";

genCmdRouter.register({
    type: "manifest",
    alias: ["ma"],
    description: "生成manifest.json",
    async handler(args, rawType) {
        intro("生成manifest");

        const options = await createManifestOptions();

        const path = genManifest(options);

        outro(`√已成功生成 manifest.json，路径: ` + chalk.grey(path));
    },
});

interface genManifestOptions {
    name: string;
    description: string;
    version?: version;
    min_engine_version?: version;
    dependencies?: dependency[];
    modules: modules[];
}

async function genManifest(options: genManifestOptions) {
    const config = await ConfigManager.get();
    const data: manifest = {
        format_version: config.gen!.manifest!,
        header: {
            name: options.name,
            description: options.description,
            uuid: v4(),
            version: "1.0.0",
            min_engine_version: "1.26.10",
        },
        dependencies: options.dependencies,
        modules: options.modules,
    };
    return JsonUtil.write("manifest.json", data, { space: 4 });
}

async function createManifestOptions(): Promise<genManifestOptions> {
    const config = await ConfigManager.get();
    const stringVersion = config.gen!.manifest! >= 3;
    // 1. 选择类型
    const packType = exitIfCancel(
        await select({
            message: "请选择 manifest 类型",
            options: [
                { label: "资源包 (Resource Pack)", value: "resource" },
                { label: "行为包 (Behavior Pack)", value: "behavior" },
            ],
        })
    );

    // 2. 基础信息
    const name = exitIfCancel(
        await text({
            message: "请输入包名称",
            placeholder: "My Pack",
            validate: (v) => (!v ? "不能为空" : undefined),
        })
    );

    const description = exitIfCancel(
        await text({
            message: "请输入描述",
            placeholder: "My awesome pack",
            validate: (v) => (!v ? "不能为空" : undefined),
        })
    );

    // 可选版本
    const useCustomVersion = exitIfCancel(
        await confirm({
            message: "是否自定义 version？",
            initialValue: false,
        })
    );

    let version: version | undefined;
    if (useCustomVersion) {
        const v = exitIfCancel(
            await text({
                message: "输入 version (如 1.0.0)",
                placeholder: "1.0.0",
                validate(value) {
                    if (!value) return "不能为空";
                    // 匹配 1.0.0 / 10.2.3 这种格式
                    if (!/^\d+\.\d+\.\d+$/.test(value)) {
                        return "格式必须为 x.y.z，例如 1.0.0";
                    }
                    return;
                },
            })
        );
        version = stringVersion ? v : (v.split(".") as any as version);
    }

    const modules: modules[] = [];
    let dependencies: dependency[] | undefined;

    // 3. 根据类型处理
    if (packType === "resource") {
        modules.push({
            type: "resources",
            uuid: v4(),
            version: stringVersion ? "1.0.0" : [1, 0, 0],
        });
    } else {
        // 是否启用 scripts
        const enableScripts = exitIfCancel(
            await confirm({
                message: "是否启用 scripts？",
                initialValue: true,
            })
        );

        if (enableScripts) {
            modules.push({
                description: "scripts",
                type: "script",
                language: "javascript",
                uuid: v4(),
                version: stringVersion ? "1.0.0" : [1, 0, 0],
                entry: "scripts/main.js",
            });

            // 多选 dependencies（示例项，可自行扩展）
            const depChoices = exitIfCancel(
                await multiselect({
                    message: "选择依赖（可选）",
                    options: [
                        {
                            label: "@minecraft/server",
                            value: "@minecraft/server",
                        },
                        {
                            label: "@minecraft/server-ui",
                            value: "@minecraft/server-ui",
                        },
                    ],
                    required: false,
                })
            );

            if (depChoices.length > 0) {
                dependencies = depChoices.map((name) => ({
                    module_name: name,
                    version: "beta",
                }));
            } else {
                dependencies = [];
            }
        }
    }

    return {
        name,
        description,
        version,
        modules,
        dependencies,
    };
}
