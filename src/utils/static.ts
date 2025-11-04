import { Option } from "@clack/prompts";
import { NpmVersionPatterns } from "interface";

export const npmRegistries: Option<string>[] = [
    { label: "官方源", value: "https://registry.npmjs.org/" },
    { label: "镜像源", value: "https://registry.npmmirror.com/", hint: "默认" },
];

export const mcUniversalPattern: NpmVersionPatterns = {
    stable: /^\d+\.\d+\.\d+$/,
    beta: /^.+-beta(?:\.\d+)*-stable$/,
};

export const PackPattern: Record<string, NpmVersionPatterns> = {
    "@minecraft/server": mcUniversalPattern,
    "@minecraft/server-ui": mcUniversalPattern,
    "@minecraft/server-gametest": mcUniversalPattern,
    "@minecraft/server-admin": mcUniversalPattern,
    "@minecraft/server-net": mcUniversalPattern,
    "@minecraft/server-editor": mcUniversalPattern,
    "@minecraft/debug-utilities": mcUniversalPattern,
    "@minecraft/vanilla-data": {
        stable: /^\d+\.\d+\.\d+$/,
        beta: /^\d+\.\d+\.\d+$/,
    },
    "sapi-pro": {
        stable: /^\d+\.\d+\.\d+-stable$/,
        beta: /^\d+\.\d+\.\d+$/,
    },
};
