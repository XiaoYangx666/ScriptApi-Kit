import { cancel, intro, isCancel, outro, select, text } from "@clack/prompts";
import { existsSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, parse, resolve } from "path";
import { genCmdRouter } from "../apps/gen.js";
import { ConfigManager } from "../utils/config.js";

type SoundDefinitions = {
    format_version: string;
    sound_definitions: Record<string, { category: string; sounds: string[] }>;
};

const categories = [
    "master",
    "music",
    "record",
    "weather",
    "block",
    "hostile",
    "neutral",
    "player",
    "ambient",
    "voice",
    "ui",
];

genCmdRouter.register({
    type: "sound",
    alias: ["sd"],
    description: "遍历sounds目录，生成sound_definitions.json",
    async handler(args, rawType) {
        const config = await ConfigManager.get();
        intro("生成sound_definitions.json");
        if (!config.rpRoot || !existsSync(config.rpRoot)) {
            throw new Error("未配置资源包目录或目录不存在");
        }
        const soundsPath = resolve(config.rpRoot!, "sounds");
        const result = await generateSoundDefinitions(soundsPath);

        // 👉 写入文件
        writeFileSync(
            resolve(soundsPath, "sound_definitions.json"),
            JSON.stringify(result, null, 2),
            "utf-8"
        );

        outro(`✔ 已生成 sound_definitions.json`);
    },
});

export async function generateSoundDefinitions(soundsDir: string) {
    const absSoundsDir = resolve(soundsDir);

    const result: SoundDefinitions = {
        format_version: "1.26.0",
        sound_definitions: {},
    };

    const folders = readdirSync(absSoundsDir).filter((f) =>
        statSync(join(absSoundsDir, f)).isDirectory()
    );

    for (const folder of folders) {
        // 👉 选择 category
        const category = await select({
            message: `选择文件夹 "${folder}" 的 category`,
            options: categories.map((c) => ({ label: c, value: c })),
        });

        if (isCancel(category)) {
            cancel("操作取消");
            process.exit(0);
        }

        // 👉 自定义前缀
        const prefix = await text({
            message: `设置 "${folder}" 的前缀（默认: ${folder}）`,
            placeholder: folder,
        });

        if (isCancel(prefix)) {
            cancel("操作取消");
            process.exit(0);
        }

        const finalPrefix = prefix || folder;

        const folderPath = join(absSoundsDir, folder);

        const files = readdirSync(folderPath).filter((f) => f.endsWith(".ogg"));

        for (const file of files) {
            const name = parse(file).name;

            const soundId = `${finalPrefix}.${name}`;

            result.sound_definitions[soundId] = {
                category,
                sounds: [`sounds/${folder}/${name}`],
            };
        }
    }
    return result;
}
