import { Telegraf } from "telegraf";
import { IBotContext } from "../context/context.interface";

export abstract class Action {
    protected constructor(public bot: Telegraf<IBotContext>) {}

    abstract handle(): void;
}