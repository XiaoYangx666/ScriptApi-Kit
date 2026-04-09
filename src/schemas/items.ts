export interface ItemJson {
    format_version: string;
    "minecraft:item": {
        description: {
            identifier: string;
            menu_category?: {
                category: string;
                group?: string;
                is_hidden_in_commands?: boolean;
            };
        };
        components: Record<string, any>;
    };
}
