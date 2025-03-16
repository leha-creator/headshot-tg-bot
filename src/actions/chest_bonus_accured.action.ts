import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {Action} from "./action.class";
import {DailyBoxSchema} from "../Models/DailyBox.model";

export class ChestBonusAccruedAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^chest-bonuses-accrued-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx: any) => {
            const year = ctx.match[1];
            const month = ctx.match[2];
            const day = ctx.match[3];
            const chat_id = ctx.match[4];
            const DailyBox = model("DailyBox", DailyBoxSchema);
            const box_id = year + '-' + month + '-' + day;
            const daily_box = await DailyBox.findOne({chat_id: chat_id, box_id: box_id});
            if (daily_box) {
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: chat_id});
                if (user) {
                    daily_box.is_bonus_accrued = true;
                    await daily_box.updateOne(daily_box);

                    await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, '[Рундук] Пользователю ' + user.phone + ' зачислено ' + daily_box.code + ' бонусов ✅');
                }
            }
        });
    }
}

