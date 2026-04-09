import Table from "cli-table3";

type Handler = (args: string[], rawType: string) => void | Promise<void>;

interface RegisterOptions {
    type: string; // 主类型，如 controller
    alias?: string[]; // 别名，如 ['c']
    description?: string; // 用于 help
    handler: Handler;
}

class TypeRouter {
    private readonly typeMap = new Map<string, RegisterOptions>();
    private readonly aliasMap = new Map<string, string>(); // alias -> type

    /**
     * 注册类型
     */
    register(options: RegisterOptions) {
        const { type, alias = [] } = options;

        if (this.typeMap.has(type)) {
            throw new Error(`类型 "${type}" 已被注册`);
        }

        this.typeMap.set(type, options);

        for (const a of alias) {
            if (this.aliasMap.has(a)) {
                throw new Error(`别名 "${a}" 已被占用`);
            }
            this.aliasMap.set(a, type);
        }
    }

    /**
     * 解析类型（支持 alias）
     */
    private resolveType(input: string): string | undefined {
        if (this.typeMap.has(input)) return input;
        return this.aliasMap.get(input);
    }

    /**
     * 执行
     */
    async run(typeInput: string, args: string[] = []) {
        const type = this.resolveType(typeInput);

        if (!type) {
            throw new Error(`未知类型 "${typeInput}"`);
        }

        const config = this.typeMap.get(type)!;
        return await config.handler(args, typeInput);
    }

    /**
     * 获取所有类型（用于 help）
     */
    list() {
        return Array.from(this.typeMap.values()).map((v) => ({
            type: v.type,
            alias: v.alias ?? [],
            description: v.description ?? "",
        }));
    }

    /**
     * 表格形式 help（cli-table3）
     */
    getHelpTable() {
        const table = new Table({
            head: ["类型", "别名", "说明"],
            colAligns: ["left", "left", "left"],
            wordWrap: true,
            style: {
                head: ["green"],
            },
        });

        const list = this.list().sort((a, b) => a.type.localeCompare(b.type));

        for (const v of list) {
            table.push([
                v.type,
                v.alias.length ? v.alias.join(", ") : "-",
                v.description || "",
            ]);
        }

        return table.toString();
    }

    /**
     * 完整 help 文本（推荐用这个）
     */
    getHelpText() {
        return `
用法: gen <类型> [名称]

可用类型:
${this.getHelpTable()}
`.trim();
    }
}

/**
 * 单例导出
 */
export const genCmdRouter = new TypeRouter();
