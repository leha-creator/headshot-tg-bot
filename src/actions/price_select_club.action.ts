import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {CLUBS} from "../scenes/price.scene";

export class PriceSelectClubAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^price-select-club-(\d+)$/, async (ctx) => {
            if (CLUBS[ctx.match[1]] !== undefined) {
                await ctx.replyWithPhoto(CLUBS[ctx.match[1]].price_url);
            }
        });
    }
}

