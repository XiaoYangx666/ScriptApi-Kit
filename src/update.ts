import { readFileSync, writeFileSync } from "fs";

import { input, formatTime, getManifestData } from "./func.js";
import { isManifestData, packageJson } from "./interface.js";

const giteeRoot = "https://gitee.com/ykxyx666_admin/SAPI-Pro/raw/master";
const githubRoot = "https://raw.githubusercontent.com/XiaoYangx666/SAPI-Pro/refs/heads/master";

function logStep(title: string) {
    console.log(`${formatTime()} 🔄 ${title}`);
}

function logDone(title: string) {
    console.log(`${formatTime()} ✅ ${title}`);
}

async function updateManifest(root: string) {
    logStep("更新 manifest.json");
    const ans = await fetch(`${root}/template/manifest.json`);
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
    console.log("🌐 请选择更新源：");
    console.log("  1. Gitee");
    console.log("  2. GitHub");
    const ans = await input("请输入序号 (1 / 2): ");

    let root: string;
    if (ans === "1") {
        root = giteeRoot;
    } else if (ans === "2") {
        root = githubRoot;
    } else {
        console.error("❌ 无效输入，请输入 1 或 2");
        return;
    }

    try {
        await Promise.all([updateManifest(root), updatePackage(root)]);
        console.log("🎉 所有更新完成！请执行npm i更新依赖");
    } catch (err) {
        console.error("⚠️ 更新失败:", err);
    }
}
