import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import {model} from "mongoose";
import {HelpMessageSchema} from "../Models/HelpMessage.model";
import {ConfigService} from "../config/configService";

const configService = ConfigService.getInstance();

export class MessageCommands extends Command {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.on('message', (ctx: any) => {
            if (ctx.message.reply_to_message) {
                this.forwardToUser(ctx);
            }
        });
    }

    async forwardToUser(ctx) {
        const HelpMessage = model("HelpMessage", HelpMessageSchema);
        const helpMessage = await HelpMessage.findOne({message_id: ctx.message.reply_to_message.message_id});
        if (helpMessage) {
            ctx.telegram.copyMessage(helpMessage.chat_id, configService.get('HEADSHOT_HELP_GROUP_ID'), ctx.message.message_id);
        }
    }
}