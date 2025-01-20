import { config, DotenvParseOutput } from "dotenv";
import { IConfigServise } from "./config.interface";

export class ConfigService implements IConfigServise {
    private static instance: ConfigService;
    private readonly config: DotenvParseOutput;

    constructor() {
        const { error, parsed } = config();
        if (error) {
            throw new Error('Не найден файл .env');
        }
        if (!parsed) {
            throw new Error('Пустой файл .env');
        }

        this.config = parsed;
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }

        this.instance = new ConfigService();
        return this.instance;
    }


    get(key: string): string {
        const res = this.config[key];
        if (!res) {
            throw new Error(`Нет такого ключа: ${key}`);
        }

        return res;
    }
}