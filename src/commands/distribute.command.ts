import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {logger} from "../helpers/logger";

export class DistributeCommand extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.command('distribute', async (ctx) => {
            const admin_chat_id = ctx.message.from.id;
            if (!this.adminService.isAdmin(admin_chat_id)) {
                return ctx.reply(`Недостаточно прав`);
            }

            if (ctx.message.reply_to_message == undefined) {
                return ctx.reply(`Команда должна вызываться ответом на сообщение`);
            }

            const User = model("User", UserSchema);
            const users = await User.find();
            const total_users = users.length;
            const message = await ctx.reply("Рассылка запущена (кол-во пользователей: " + total_users + ")\nПрогресс 0%");
            if (message && message.message_id) {
                let forbidden_counter = 0;
                let processed_counter = 0;
                for (const user of users) {
                    try {
                        if (total_users > 100) {
                            if (processed_counter % 100 === 0 && processed_counter > 0) {
                                const percent = Math.round(processed_counter / total_users * 1000) / 10;
                                await this.bot.telegram.editMessageText(admin_chat_id, message.message_id, undefined, "Рассылка запущена (кол-во пользователей: " + total_users + ")\nПрогресс " + percent + "% (" + processed_counter + ")");
                            }
                        }

                        await ctx.telegram.copyMessage(user.chat_id, ctx.message.chat.id, ctx.message.reply_to_message.message_id);
                    } catch (e) {
                        forbidden_counter += 1;
                        logger.error(e);
                    }

                    processed_counter += 1;
                }

                await this.bot.telegram.editMessageText(admin_chat_id, message.message_id, undefined, "Рассылка запущена (кол-во пользователей: " + total_users + ")\nПрогресс " + 100 + "%\nРассылка завершена, пользователей заблокировавших бота: " + forbidden_counter);
            }
        });
    }
}