import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {Action} from "./action.class";
import {ActionSchema} from "../Models/Action.model";

export class ActionBonusAccruedAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('action-bonus-accrued', async (ctx: any) => {
            const Action = model("Action", ActionSchema);
            const action = await Action.findOne({message_id: ctx.update.callback_query.message.message_id});
            if (action && action.chat_id !== undefined) {
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: action.chat_id});
                if (user) {
                    action.is_bonus_accrued = true;
                    action.is_processed = true;
                    await this.bot.telegram.editMessageText(ctx.chat.id, ctx.update.callback_query.message.message_id, undefined, '[Акция] Пользователю ' + user.phone + ' зачислено ' + action.balance + ' бонусов ✅');
                    await action.save();
                }
            }
        });
    }
}

