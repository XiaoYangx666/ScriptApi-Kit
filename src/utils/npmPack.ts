import { URL } from "url";
import { npmPackInfo, NpmVersionPatterns, versionType } from "../interface";
import { runCommand } from "./func.js";
import { mcUniversalPattern, PackPattern } from "./static.js";

export class NpmPackManager {
    constructor(public readonly registry: string) {}

    /**获取所有版本 */
    async getNpmPackVersions(packName: string) {
        const ans = await fetch(new URL(packName, this.registry).href);
        const data = (await ans.json()) as npmPackInfo;
        if (!data || !data.versions || !data._id || !data.name) {
            throw new Error(`获取包:${packName} 信息失败`);
        }
        return Object.keys(data.versions).reverse();
    }

    /**获取分类的最新版本 */
    async getCategorizedVersions(
        packName: string
    ): Promise<CategorizedVersion | undefined> {
        //获取pattern
        let pattern: NpmVersionPatterns;
        if (PackPattern[packName] != undefined) {
            pattern = PackPattern[packName];
        } else if (packName.startsWith("@minecraft/")) {
            pattern = mcUniversalPattern;
        } else {
            return undefined;
        }
        //匹配最新版本
        const versions = await this.getNpmPackVersions(packName);
        const stable = versions.find((v) => pattern.stable.test(v));
        const beta = versions.find((v) => pattern.beta.test(v));
        const latest = versions[0];

        return { stable, beta, latest };
    }

    /**获取多个包的最新版本 */
    async getLatestVersionsForPacks(
        packs: string[]
    ): Promise<PackWithVersion[]> {
        const latestVersions = await Promise.all(
            packs.map(async (name) => {
                const versions = await this.getCategorizedVersions(name);
                return { name, version: versions };
            })
        );
        return latestVersions.filter((t) => t.version != undefined);
    }

    /**安装依赖 */
    async install() {
        await runCommand(
            `npm install --registry ${this.registry} --legacy-peer-deps`
        );
    }
}

export interface PackWithVersion {
    name: string;
    version?: CategorizedVersion;
}

export type CategorizedVersion = {
    [key in versionType]: string | undefined;
};
