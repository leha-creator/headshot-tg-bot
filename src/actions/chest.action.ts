import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {model} from "mongoose";
import {DailyBoxSchema} from "../Models/DailyBox.model";
import {increaseBonusCounter} from "../helpers/counters.service";

export const CHEST_NUMBER = 9;

export class ChestAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('chest', async (ctx: any) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'chest');
            const now = new Date();
            const box_id = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
            const DailyBox = model("DailyBox", DailyBoxSchema);
            const isDailyBoxExist = await DailyBox.findOne({chat_id: chat_id, box_id: box_id});
            if (isDailyBoxExist != null) {
                return ctx.reply('Ты уже открывал рундук! Подожди 24 часа ⏳');
            }

            const inline_keyboard: Array<Array<NonNullable<unknown>>> = [[]];

            for (let key = 1; key <= CHEST_NUMBER; key++) {
                inline_keyboard[inline_keyboard.length-1].push({text: '🎁', callback_data: 'opened-chest-' + key + '-' + box_id})
                if (inline_keyboard[inline_keyboard.length-1].length > 2 && key != CHEST_NUMBER) {
                    inline_keyboard.push([]);
                }
            }

            return await ctx.reply('🎲 Открывай ежедневный рундук и испытай удачу!\n' +
                '🕹️ В одной из 9 ячеек тебя ждёт гарантированный приз.\n' +
                '⏳ Рундук доступен раз в 24 часа, так что не пропусти!', {
                reply_markup: {
                    inline_keyboard: inline_keyboard
                },
            });
        })
    }
}

