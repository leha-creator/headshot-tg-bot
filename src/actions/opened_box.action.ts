import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {DailyBoxSchema} from "../Models/DailyBox.model";

export class OpenedBoxAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^opened-box-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx: any) => {
            const opened_box_id = ctx.match[1];
            const year = ctx.match[2];
            const month = ctx.match[3];
            const day = ctx.match[4];
            const now = new Date();
            const win_id = Math.floor(Math.random() * 2) + 1;
            const chat_id = ctx.update.callback_query.from.id;
            if (now.getFullYear() == year && now.getMonth() == month && now.getDay() == day) {
                const DailyBox = model("DailyBox", DailyBoxSchema);
                const box_id = year + '-' + month + '-' + day;
                const isDailyBoxExist = await DailyBox.findOne({chat_id: chat_id, box_id: box_id});
                if (isDailyBoxExist == null) {
                    let success = false;
                    if (win_id == opened_box_id) {
                        success = true;
                        ctx.reply('Повезло');
                    } else {
                        ctx.reply('Не повезло');
                    }

                    await DailyBox.create({
                        chat_id: chat_id,
                        is_success: success,
                        box_id: box_id,
                        code: success ? Math.floor(Math.random() * 9999) + 1 : undefined,
                    })
                } else {
                    ctx.reply('Сундук уже открыт');
                }
            }
        })
    }
}

