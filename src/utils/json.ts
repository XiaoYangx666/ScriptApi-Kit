import * as fs from "fs";
import * as path from "path";

export class JsonUtil {
    /**
     * 解析路径（默认基于 cwd）
     */
    private static resolvePath(filePath?: string): string {
        if (!filePath) {
            throw new Error("JsonUtil: filePath is required");
        }
        return path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);
    }

    /**
     * 读取 JSON（带泛型 + 类型守卫）
     */
    static read<T>(filePath: string, guard?: (data: unknown) => data is T): T {
        const fullPath = this.resolvePath(filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`JsonUtil.read: File not found -> ${fullPath}`);
        }

        try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const parsed: unknown = JSON.parse(content);

            if (guard && !guard(parsed)) {
                throw new Error(
                    `JsonUtil.read: Type guard validation failed -> ${fullPath}`
                );
            }

            return parsed as T;
        } catch (err: any) {
            throw new Error(
                `JsonUtil.read: Failed to read/parse JSON -> ${fullPath}\n${err.message}`
            );
        }
    }

    /**
     * 安全读取（失败返回 null）
     */
    static tryRead<T>(
        filePath: string,
        guard?: (data: unknown) => data is T
    ): T | null {
        try {
            return this.read<T>(filePath, guard);
        } catch {
            return null;
        }
    }

    /**
     * 写入 JSON
     * @returns 文件完整路径
     */
    static write<T>(
        filePath: string,
        data: T,
        options?: {
            space?: number;
        }
    ): string {
        const fullPath = this.resolvePath(filePath);

        try {
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) {
                throw new Error("目录不存在");
            }

            const json = JSON.stringify(data, null, options?.space ?? 2);
            fs.writeFileSync(fullPath, json, "utf-8");
        } catch (err: any) {
            throw new Error(
                `JsonUtil.write: Failed to write JSON -> ${fullPath}\n${err.message}`
            );
        }

        return fullPath;
    }

    /**
     * 更新 JSON（读 → 修改 → 写）
     */
    static update<T>(
        filePath: string,
        updater: (data: T) => T,
        guard?: (data: unknown) => data is T
    ): void {
        const current = this.read<T>(filePath, guard);
        const updated = updater(current);
        this.write(filePath, updated);
    }
}
