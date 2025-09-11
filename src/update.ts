import { readFileSync, writeFileSync } from "fs";
import { formatTime, getManifestData } from "./func.js";
import { isManifestData, packageJson } from "./interface.js";

const giteeRoot = "https://gitee.com/ykxyx666_admin/sapi-kit_template/raw/master";

function logStep(title: string) {
    console.log(`${formatTime()} 🔄 ${title}`);
}

function logDone(title: string) {
    console.log(`${formatTime()} ✅ ${title}`);
}

async function updateManifest(root: string) {
    logStep("更新 manifest.json");
    const ans = await fetch(`${root}/manifest.json`);
    const remote = await ans.json();
    if (!isManifestData(remote)) throw new Error("远程 manifest.json 格式错误");

    const local = getManifestData();
    local.dependencies = local.dependencies.map(
        (dep) => remote.dependencies.find((r) => r.module_name === dep.module_name) ?? dep
    );

    writeFileSync("./manifest.json", JSON.stringify(local, null, 4));
    logDone("manifest.json 更新完成");
}

async function updatePackage(root: string) {
    logStep("更新 package.json");
    const ans = await fetch(`${root}/package.json`);
    const remote: packageJson = await ans.json();
    const local = JSON.parse(readFileSync("./package.json", "utf-8")) as packageJson;

    local.dependencies = { ...local.dependencies, ...remote.dependencies };
    local.overrides = { ...local.overrides, ...remote.overrides };

    writeFileSync("./package.json", JSON.stringify(local, null, 4));
    logDone("package.json 更新完成");
}

export async function update() {
    try {
        console.log("开始更新...");
        await Promise.all([updateManifest(giteeRoot), updatePackage(giteeRoot)]);
        console.log("🎉 所有更新完成！请执行npm i更新依赖");
    } catch (err) {
        console.error("⚠️ 更新失败:", err);
    }
}
