import { select, text, confirm } from "@clack/prompts";
import { exitIfCancel } from "../utils/func.js";

// ---------- component 定义 ----------
export const componentDefs = [
    {
        id: "minecraft:display_name",
        label: "显示名称",
        async create() {
            const value = exitIfCancel(
                await text({
                    message: "显示名称",
                    placeholder: "Blaze Rod",
                })
            );
            return { value };
        },
    },
    {
        id: "minecraft:icon",
        label: "贴图",
        async create() {
            const texture = exitIfCancel(
                await text({
                    message: "贴图名称",
                    placeholder: "blaze_rod",
                })
            );
            return { textures: { default: texture } };
        },
    },
    {
        id: "minecraft:max_stack_size",
        label: "最大堆叠",
        async create() {
            const size = exitIfCancel(
                await text({
                    message: "最大堆叠数量",
                    placeholder: "64",
                })
            );
            return Number(size);
        },
    },
    {
        id: "minecraft:hand_equipped",
        label: "手持显示",
        async create() {
            return exitIfCancel(
                await confirm({
                    message: "是否手持显示？",
                    initialValue: true,
                })
            );
        },
    },
    {
        id: "minecraft:cooldown",
        label: "冷却",
        async create() {
            const category = exitIfCancel(
                await text({
                    message: "冷却分组 category（同组共享冷却）",
                    placeholder: "example_group",
                    validate(v) {
                        if (!v) return "不能为空";
                    },
                })
            );

            const duration = exitIfCancel(
                await text({
                    message: "冷却时间（秒）",
                    placeholder: "0.5",
                    validate(v) {
                        if (!v) return "不能为空";
                        if (isNaN(Number(v))) return "必须是数字";
                    },
                })
            );

            const type = exitIfCancel(
                await select({
                    message: "触发类型",
                    options: [
                        { label: "use（使用触发）", value: "use" },
                        { label: "attack（攻击触发）", value: "attack" },
                    ],
                    initialValue: "use",
                })
            );

            return {
                category,
                duration: Number(duration),
                type,
            };
        },
    },
    {
        id: "minecraft:fuel",
        label: "燃料",
        async create() {
            const duration = exitIfCancel(
                await text({
                    message: "燃烧时间 (tick)",
                    placeholder: "120",
                })
            );
            return { duration: Number(duration) };
        },
    },
];
