import AdmZip from "adm-zip";
import { existsSync, lstatSync, readdirSync } from "fs";
import { join } from "path";

const files = ["tools", "src", "manifest.json", "tsconfig.json", "toolconfig.ts", "package.json", ".prettierrc.json"];

const templateRoot = "./template";

const zip = new AdmZip();
for (let file of files) {
    if (!existsSync(file)) {
        continue;
    }
    const stat = lstatSync(file);
    if (stat.isFile()) {
        zip.addLocalFile(file);
    } else {
        zip.addLocalFolder(file, file);
    }
}

for (let fileName of readdirSync(templateRoot)) {
    const path = join(templateRoot, fileName);
    const stat = lstatSync(path);
    if (stat.isFile()) {
        zip.addLocalFile(path);
    } else {
        zip.addLocalFolder(path, fileName);
    }
}
zip.writeZip("build.zip");
