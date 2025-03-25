import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {logger} from "../helpers/logger";

export class DistributeCommand extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.command('distribute', async (ctx) => {
            if (!this.adminService.isAdmin(ctx.message.from.id)) {
                return ctx.reply(`Недостаточно прав`);
            }

            if (ctx.message.reply_to_message == undefined) {
                return ctx.reply(`Команда должна вызываться ответом на сообщение`);
            }

            const User = model("User", UserSchema);
            const users = await User.find();
            await ctx.reply('Рассылка запущена (кол-во пользователей: ' + users.length + ')')
            for (const user of users) {
                await ctx.telegram.copyMessage(user.chat_id, ctx.message.chat.id, ctx.message.reply_to_message.message_id);
            }

            await ctx.reply('Рассылка завершена')
        });
    }
}