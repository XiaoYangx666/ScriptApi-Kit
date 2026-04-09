import { log } from "@clack/prompts";
import { packType } from "../interface.js";
import { manifest } from "../schemas/manifest.js";
import { ConfigManager } from "./config.js";
import { JsonUtil } from "./json.js";

class ManifestReadError extends Error {
    constructor(mes: string, options?: ErrorOptions) {
        super(mes, options);
        this.name = this.constructor.name;
    }
}

export class ManifestManager {
    private filePath?: string;
    readonly type: packType;

    constructor(type: packType) {
        this.type = type;
    }

    async getPath() {
        if (!this.filePath) {
            this.filePath = await ConfigManager.getPackPath(
                this.type,
                "manifest.json"
            );
        }
        return this.filePath;
    }

    /** 获取 manifest.json */
    async read() {
        const manifestPath = await this.getPath();

        try {
            return JsonUtil.read<manifest>(manifestPath, isManifestData);
        } catch (err) {
            throw new ManifestReadError("读取manifest.json失败", {
                cause: err,
            });
        }
    }

    /** 写入 manifest.json */
    async write(data: manifest) {
        const manifestPath = await this.getPath();

        try {
            JsonUtil.write(manifestPath, data, { space: 4 });
        } catch (err) {
            throw new ManifestReadError("写入manifest.json失败", {
                cause: err,
            });
        }
    }

    /** 更新 manifest */
    async update(newData: Partial<manifest>) {
        const data = await this.read();
        // header
        if (newData.header) {
            data.header = { ...data.header, ...newData.header };
        }
        // format_version
        if (newData.format_version !== undefined) {
            data.format_version = newData.format_version;
        }
        // dependencies
        if (newData.dependencies?.length) {
            const newDeps = newData.dependencies;

            if (!data.dependencies) {
                data.dependencies = newData.dependencies;
            } else {
                for (const dependency of data.dependencies) {
                    const version = newDeps.find(
                        (t) => t.module_name == dependency.module_name
                    )?.version;
                    if (typeof version == "string") {
                        dependency.version = version;
                    }
                }
            }
        }

        await this.write(data);
    }

    /**将版本对象转为manifest中deps数组 */
    static toDepList(newDeps: Record<string, string>) {
        const entries = Object.entries(newDeps);
        const deps = entries
            .map(([name, version]) => ({
                module_name: name,
                version: getBaseVersion(version),
            }))
            .filter((d) => d.version != undefined);

        return deps as { module_name: string; version: string }[];
    }
}

export const bpManifest = new ManifestManager(packType.BP);
export const rpManifest = new ManifestManager(packType.RP);

export function isManifestData(data: unknown): data is manifest {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as any;

    return (
        typeof obj.format_version === "number" &&
        typeof obj.header === "object" &&
        obj.header !== null &&
        typeof obj.header.description === "string" &&
        typeof obj.header.name === "string" &&
        typeof obj.header.uuid === "string" &&
        obj.header.version !== undefined &&
        obj.header.min_engine_version !== undefined &&
        Array.isArray(obj.modules) &&
        Array.isArray(obj.dependencies)
    );
}

function getBaseVersion(version: string) {
    if (version.includes("preview")) {
        const match = version.match(/^(\d+.\d+.\d+-[^\.]+)/);
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
