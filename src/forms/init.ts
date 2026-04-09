import { isCancel, multiselect, text } from "@clack/prompts";

export async function selectMcPack() {
    const packs = await multiselect({
        message: "选择要安装的mc包(用空格选择)",
        options: [
            {
                value: "@minecraft/server",
                label: "@minecraft/server",
                hint: "必装",
            },
            {
                value: "@minecraft/server-ui",
                label: "@minecraft/server-ui",
                hint: "表单操作",
            },
            {
                value: "sapi-pro",
                label: "SAPI-Pro",
                hint: "行为包推荐",
            },
        ],
    });

    if (isCancel(packs)) {
        process.exit(0);
    }
    return packs;
}

export async function nameAndDesForm() {
    const name = await text({
        message: "请输入行为包名称：",
        validate(value) {
            if (value.trim().length == 0) {
                return "行为包名不能为空";
            }
        },
    });
    if (isCancel(name)) process.exit(0);
    const description = await text({
        message: "请输入行为包描述：",
        validate(value) {
            if (value.trim().length == 0) {
                return "描述不能为空";
            }
        },
    });
    if (isCancel(description)) process.exit(0);
    return { name, description };
}
