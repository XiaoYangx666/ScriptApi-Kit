import { existsSync, readFileSync, writeFileSync } from "fs";
import { packageJsonData } from "../interface";
import path from "path";

class PackageJsonReadError extends Error {
    constructor(mes: string, path: string, options?: ErrorOptions) {
        super(mes + ",path: " + path, options);
        this.name = this.constructor.name;
    }
}

class PackageJsonManager {
    readonly filePath: string;

    constructor(root: string) {
        this.filePath = path.resolve(root, "package.json");
    }

    public exists() {
        return existsSync(this.filePath);
    }

    /**从package.json中读取信息 */
    public read() {
        if (!this.exists()) {
            throw new PackageJsonReadError(
                "package.json文件不存在",
                this.filePath
            );
        }

        try {
            const data = JSON.parse(
                readFileSync(this.filePath, "utf-8")
            ) as packageJsonData;
            return data;
        } catch (err) {
            throw new PackageJsonReadError(
                "读取package.json失败",
                this.filePath,
                { cause: err }
            );
        }
    }

    public write(data: packageJsonData) {
        if (!this.exists()) {
            throw new Error("无法找到package.json");
        }
        writeFileSync(this.filePath, JSON.stringify(data, null, 4));
    }

    /**更新依赖项 */
    public updateDependencies(newDeps: Record<string, string>) {
        const data = this.read();
        //更新
        data.dependencies = { ...data.dependencies, ...newDeps };
        //更新overrides
        const newDepMap = new Map(Object.entries(newDeps));
        for (let overrideKey of Object.keys(data.overrides)) {
            const overrideDeps = data.overrides[overrideKey];
            for (let itemKey of Object.keys(overrideDeps)) {
                const item = newDepMap.get(itemKey);
                if (item) {
                    overrideDeps[itemKey] = item;
                }
            }
        }
        this.write(data);
    }
}

export const packageJsonManager = new PackageJsonManager("./");
