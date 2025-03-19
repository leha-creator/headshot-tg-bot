import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {CLUBS} from "../scenes/price.scene";
import {increaseBonusCounter} from "../helpers/counters.service";

export class PriceSelectClubAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^price-select-club-(\d+)$/, async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'price-select-club-' + ctx.match[1]);

            if (CLUBS[ctx.match[1]] !== undefined) {
                await ctx.replyWithPhoto(CLUBS[ctx.match[1]].price_url);
            }
        });
    }
}

