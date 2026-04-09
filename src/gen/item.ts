import {
    confirm,
    intro,
    multiselect,
    outro,
    select,
    text,
} from "@clack/prompts";
import chalk from "chalk";
import { genCmdRouter } from "../apps/gen.js";
import { ItemJson } from "../schemas/items.js";
import { exitIfCancel } from "../utils/func.js";
import { JsonUtil } from "../utils/json.js";
import { componentDefs } from "./itemComponents.js";
import { ConfigManager } from "../utils/config.js";
import { sapiKitConfig } from "../interface.js";
import { resolve } from "path";
import { existsSync, mkdir, mkdirSync } from "fs";

genCmdRouter.register({
    type: "item",
    alias: ["it"],
    description: "生成物品json",
    async handler(args, rawType) {
        if (!args[0]) {
            throw new Error("未输入文件名");
        }
        const config = await ConfigManager.get();

        intro("生成item");
        const json = await createItemJson(config);

        const itemFolder = resolve(config.bpRoot ?? "./", "items");
        if (!existsSync(itemFolder)) {
            mkdirSync(itemFolder);
        }
        const path = JsonUtil.write(
            resolve(itemFolder, `${args[0]}.json`),
            json,
            { space: 4 }
        );
        outro(`√已成功生成 item,路径: ` + chalk.grey(path));
    },
});

// ---------- 主函数 ----------
export async function createItemJson(config: sapiKitConfig): Promise<ItemJson> {
    // format_version
    const format_version_default = config.gen!.format_version!;
    const format_version = exitIfCancel(
        await text({
            message: "format_version",
            defaultValue: format_version_default,
            placeholder: format_version_default,
        })
    );

    // identifier
    const identifier = exitIfCancel(
        await text({
            message: "物品 identifier",
            placeholder: "namespace:item_name",
            validate(v) {
                if (!v) return "不能为空";
            },
        })
    );

    // ---------- menu_category ----------
    const useMenuCategory = exitIfCancel(
        await confirm({
            message: "是否配置 menu_category？",
            initialValue: true,
        })
    );

    let menu_category: ItemJson["minecraft:item"]["description"]["menu_category"];

    if (useMenuCategory) {
        const category = exitIfCancel(
            await select({
                message: "选择 category",
                options: [
                    { label: "construction", value: "construction" },
                    { label: "nature", value: "nature" },
                    { label: "equipment", value: "equipment" },
                    { label: "items", value: "items" },
                    { label: "none", value: "none" },
                ],
            })
        );

        const group = exitIfCancel(
            await text({
                message: "group（可选）",
                placeholder: "itemGroup.name.xxx",
            })
        );

        const hidden = exitIfCancel(
            await confirm({
                message: "是否隐藏于命令？",
                initialValue: false,
            })
        );

        menu_category = {
            category,
            ...(group ? { group } : {}),
            ...(hidden ? { is_hidden_in_commands: true } : {}),
        };
    }

    // ---------- components ----------
    const selected = exitIfCancel(
        await multiselect({
            message: "选择 components",
            options: componentDefs.map((c) => ({
                label: `${c.label}(${c.id})`,
                value: c.id,
            })),
            required: false,
        })
    );

    const components: Record<string, any> = {};

    for (const id of selected) {
        const def = componentDefs.find((c) => c.id === id)!;
        components[id] = await def.create();
    }

    // ---------- 最终 JSON ----------
    const json: ItemJson = {
        format_version,
        "minecraft:item": {
            description: {
                identifier,
                ...(menu_category ? { menu_category } : {}),
            },
            components,
        },
    };

    return json;
}
