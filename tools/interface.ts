export interface toolConfig {
    //build配置
    /** 是否每次构建前清空 scripts 目录（建议在打包异常时开启） */
    shouldClearOutput: boolean;

    //copy配置
    /** 构建完成后是否自动复制行为包到游戏目录 */
    shouldCopyToGame: boolean;
    /** 游戏路径类型："win" 表示默认 Windows 路径，"custom" 表示自定义路径 */
    gamePathMode: "win" | "custom";
    /** 自定义游戏路径（指向 development_behavior_packs 的上一级目录）
     * 仅当 gamePathMode 为 "custom" 时有效 */
    customGameRoot: string;
    /** 行为包在 development_behavior_packs 中的文件夹名称 */
    behaviorPackFolderName?: string;

    //打包配置
    /** 自定义打包名，若未定义，则从manifest.json读取*/
    packageName?: string;
    /** 是否启用二次 zip 压缩（用于上传蓝奏云等平台） */
    enableExtraZip: boolean;
    /** 打包文件名中是否包含版本号（版本号从 manifest.json 中读取） */
    includeVersionInName: boolean;
    /** 是否使用逗号格式的版本号如 v1,x,x 以兼容某些玩家导入问题 */
    useCommaStyleVersion: boolean;
}

export interface dependency {
    module_name: string;
    version: string;
}

export interface manifest {
    format_version: number;
    header: {
        description: string;
        name: string;
        uuid: string;
        version: [number, number, number];
        min_engine_version: [number, number, number];
    };
    dependencies: dependency[];
}

export function isManifestData(data: any): data is manifest {
    return data != undefined && data.header && data.header.name && data.header.uuid;
}

interface overrides {
    [key: string]: {
        [key: string]: string;
    };
}

export interface packageJson {
    dependencies: Record<string, string>;
    overrides: overrides;
}
