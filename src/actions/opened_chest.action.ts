import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {model} from "mongoose";
import {DailyBoxSchema} from "../Models/DailyBox.model";
import {CHEST_NUMBER} from "./chest.action";

export class OpenedChestAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^opened-chest-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx: any) => {
            const opened_chest_id = ctx.match[1];
            const year = ctx.match[2];
            const month = ctx.match[3];
            const day = ctx.match[4];
            const now = new Date();
            const win_id = Math.floor(Math.random() * CHEST_NUMBER) + 1;
            const chat_id = ctx.update.callback_query.from.id;
            if (now.getFullYear() == year && now.getMonth() == month && now.getDay() == day) {
                const DailyBox = model("DailyBox", DailyBoxSchema);
                const box_id = year + '-' + month + '-' + day;
                const isDailyBoxExist = await DailyBox.findOne({chat_id: chat_id, box_id: box_id});
                if (isDailyBoxExist == null) {
                    let success = false;
                    let code: undefined|number = undefined;
                    if (win_id == opened_chest_id) {
                        success = true;
                        code = Math.floor(Math.random() * 9999);
                    }

                    await DailyBox.create({
                        chat_id: chat_id,
                        is_success: success,
                        box_id: box_id,
                        code: code,
                    })

                    await this.bot.telegram.deleteMessage(chat_id, ctx.update.callback_query.message.message_id);

                    if (success) {
                        return ctx.reply(`Ура! Поздравляем, ты выиграл ${code}!`);
                    }

                    return ctx.reply('К сожалению, удача не на твоей стороне... Но не сдавайся! 💪');
                } else {
                    return ctx.reply('Ты уже открывал рундук! Подожди 24 часа ⏳');
                }
            }
        })
    }
}

