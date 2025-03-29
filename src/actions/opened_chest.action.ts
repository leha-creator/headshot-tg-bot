import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {model} from "mongoose";
import {DailyBoxSchema} from "../Models/DailyBox.model";
import {CHEST_NUMBER} from "./chest.action";
import {AdminService} from "../helpers/admin.service";
import {UserSchema} from "../Models/User.model";
import {increaseBonusCounter} from "../helpers/counters.service";

const WIN_CODES = [15, 30, 50];

export class OpenedChestAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^opened-chest-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'opened-chest');

            const opened_chest_id = ctx.match[1];
            const year = ctx.match[2];
            const month = ctx.match[3];
            const day = ctx.match[4];
            const now = new Date();
            const win_id = Math.floor(Math.random() * CHEST_NUMBER) + 1;
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: chat_id});
            if (!user || !user.phone) {
                return ctx.reply('Зарегистрируйся и попробуй ещё раз!');
            }
            if (now.getFullYear() == year && (now.getMonth() + 1) == month && now.getDate() == day) {
                const DailyBox = model("DailyBox", DailyBoxSchema);
                const box_id = year + '-' + month + '-' + day;
                const isDailyBoxExist = await DailyBox.findOne({chat_id: chat_id, box_id: box_id});
                if (isDailyBoxExist == null) {
                    let success = false;
                    let code: undefined | number = undefined;
                    if (win_id == opened_chest_id) {
                        success = true;
                        code = WIN_CODES[Math.floor(Math.random() * WIN_CODES.length)];
                    }

                    await DailyBox.create({
                        chat_id: chat_id,
                        is_success: success,
                        is_bonus_accrued: false,
                        box_id: box_id,
                        code: code,
                    })

                    await this.bot.telegram.deleteMessage(chat_id, ctx.update.callback_query.message.message_id);
                    if (success) {
                        AdminService.sendMessagesToAdminOnChestWin(user, code!, ctx, box_id);
                        return ctx.reply('🎲 Ты открыл рундук и нашёл:\n' +
                            '🎁' + code + ' бонусных рублей!\n' +
                            '💸 Они будут начислены в ближайшее время.\n');
                    }

                    return ctx.reply('К сожалению, удача не на твоей стороне... Но не сдавайся! 💪');
                } else {
                    return ctx.reply('Ты уже открывал рундук! Подожди 24 часа ⏳');
                }
            }
        })
    }
}

