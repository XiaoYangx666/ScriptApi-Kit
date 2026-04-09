import { version } from "../interface";

export interface manifest {
    format_version: number;
    header: {
        description: string;
        name: string;
        uuid: string;
        version: version;
        min_engine_version: version;
    };
    modules: modules[];
    dependencies?: dependency[];
}

export interface modules {
    type: string;
    uuid: string;
    version: version;
    description?: string;
    language?: string;
    entry?: string;
}

export interface dependency {
    module_name?: string;
    uuid?: string;
    version: string | version;
}
