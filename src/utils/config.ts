import { existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { resolveGameRoot } from "../apps/copy.js";
import { packType, sapiKitConfig } from "../interface.js";
import { ConfigLoadError } from "./errors.js";

export class ConfigManager {
    private static defaultConfigPath = "./sapi-kit.config.mjs";
    private static configCache: sapiKitConfig | null = null;

    /**获取包配置 */
    static async get(
        configPath: string = this.defaultConfigPath
    ): Promise<sapiKitConfig> {
        if (this.configCache) {
            return { ...this.configCache };
        }

        // 解析路径
        const absPath = path.resolve(configPath);
        if (!existsSync(absPath)) {
            throw new ConfigLoadError(`配置文件不存在: ${absPath}`);
        }

        try {
            // 动态加载配置文件
            const configModule = await import(pathToFileURL(absPath).href);
            const finalConfig = configModule.default as sapiKitConfig;
            // 缓存
            this.configCache = finalConfig;

            return { ...finalConfig };
        } catch (err) {
            throw new ConfigLoadError(
                `加载配置文件失败: ${(err as Error).message}`
            );
        }
    }

    /** 获取指定包类型的根路径或文件路径 */
    static async getPackPath(
        type: packType,
        relativePath?: string
    ): Promise<string> {
        const config = await this.get();

        const root = type == packType.BP ? config.bpRoot : config.rpRoot;

        if (!root) {
            throw new ConfigLoadError(
                `未配置 ${
                    type === packType.BP ? "bpRoot" : "rpRoot"
                }，请检查配置文件`
            );
        }

        if (!relativePath) {
            return root;
        }

        return path.resolve(root, relativePath);
    }

    static async checkConfig() {
        const config = await this.get();
        const results: string[] = [];
        for (const [key, fn] of Object.entries(configCheckList) as [
            keyof sapiKitConfig,
            any,
        ][]) {
            const msg = await fn(config[key], config);
            if (msg) results.push(`${key}: ` + msg);
        }
        return results;
    }
}

type ConfigChecker<T> = {
    [K in keyof T]?: (
        value: T[K],
        config: T
    ) => string | undefined | Promise<string | undefined>;
};

function requireExists<K extends keyof sapiKitConfig>(
    name: K
): (value: sapiKitConfig[K]) => string | undefined {
    return (value) => (value == undefined ? "此项未配置" : undefined);
}

const configCheckList: ConfigChecker<sapiKitConfig> = {
    bpRoot: async (value) => {
        if (!value) return "未配置此项，将无法构建";
        if (!existsSync(value)) return `路径不存在: ${value}`;
    },
    rpRoot: async (value) => {
        if (!value) return;
        if (!existsSync(value)) return `路径不存在: ${value}`;
    },
    cacheDir: requireExists("cacheDir"),
    entryPoint(value) {
        return value ? undefined : "入口文件未配置，无法构建";
    },
    gamePathMode: async (value, config) => {
        if (!config.shouldCopyToGame) return;
        if (!value) return "未配置此项，将无法拷贝到游戏";
        if (value != "win" && value != "custom") {
            return "值必须为win或custom";
        }
        if (value == "win") {
            const gameRoot = resolveGameRoot(config);
            if (!gameRoot) return "windows游戏根目录解析失败";
            if (!existsSync(gameRoot)) {
                return "游戏根目录不存在: " + gameRoot;
            }
        }
    },
    customGameRoot: async (value, config) => {
        if (!config.shouldCopyToGame || config.gamePathMode != "custom") return;
        const gameRoot = resolveGameRoot(config);
        if (!gameRoot) return "自定义游戏根目录解析失败";
        if (!existsSync(gameRoot)) {
            return "游戏根目录不存在: " + gameRoot;
        }
    },
};
