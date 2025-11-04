import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { manifest, packType } from "../interface.js";
import { ConfigManager } from "./config.js";

class ManifestReadError extends Error {
    constructor(mes: string, options?: ErrorOptions) {
        super(mes, options);
        this.name = this.constructor.name;
    }
}

class ManifestManager {
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

    /**获取行为包/资源包的manifest.json数据 */
    async read() {
        const manifestPath = await this.getPath();

        if (!existsSync(manifestPath)) {
            throw new ManifestReadError(
                `读取manifest.json失败,文件不存在：` + manifestPath
            );
        }

        try {
            const data = readFileSync(manifestPath, { encoding: "utf-8" });
            const jsondata = JSON.parse(data);
            if (!isManifestData(jsondata)) {
                throw new ManifestReadError("读取manifest.json失败,类型错误");
            }
            return jsondata;
        } catch (err) {
            throw new ManifestReadError("读取manifest.json失败", {
                cause: err,
            });
        }
    }

    /**写入文件 */
    async write(data: manifest) {
        const manifestPath = await this.getPath();
        if (!existsSync(manifestPath)) {
            throw new ManifestReadError(
                `manifest.json文件不存在：` + manifestPath
            );
        }
        await writeFile(manifestPath, JSON.stringify(data, null, 4));
    }

    /**更新manifest字段 */
    async update(newData: Partial<manifest>) {
        let data = await this.read();

        //更新
        data.header = { ...data.header, ...newData.header };
        data.format_version = newData.format_version ?? data.format_version;
        //更新依赖版本
        if (newData.dependencies && newData.dependencies.length) {
            const newDepsMap = new Map(
                newData.dependencies.map((t) => [t.module_name, t.version])
            );
            for (const dependency of data.dependencies) {
                const version = newDepsMap.get(dependency.module_name);
                if (version) {
                    dependency.version = version;
                }
            }
        }

        bpManifest.write(data);
    }
}

export const bpManifest = new ManifestManager(packType.BP);
export const rpManifest = new ManifestManager(packType.RP);

export function isManifestData(data: any): data is manifest {
    return (
        data != undefined && data.header && data.header.name && data.header.uuid
    );
}
