import { confirm, isCancel } from "@clack/prompts";

export async function confirmForm(message: string) {
    const result = await confirm({ message });
    if (isCancel(result) || !result) {
        process.exit(0);
    }
}
