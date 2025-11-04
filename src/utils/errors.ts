export class TSCError extends Error {
    constructor(message: string, option?: ErrorOptions) {
        super(message, option);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, ConfigLoadError);
    }
}

export class ConfigLoadError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "ConfigLoadError";
        Error.captureStackTrace(this, ConfigLoadError);
        this.stack = undefined;
    }
}
