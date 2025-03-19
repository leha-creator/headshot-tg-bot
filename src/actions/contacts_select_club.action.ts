import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {ACTIONS} from "../scenes/current_actions.scene";
import {CLUB_CONTACTS} from "../scenes/contacts.scene";
import {increaseBonusCounter} from "../helpers/counters.service";

export class ContactSelectClubAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^contacts-select-club-(\d+)$/, async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'contacts-select-club-' + ctx.match[1]);

            if (ACTIONS[ctx.match[1]] !== undefined) {
                await ctx.reply(CLUB_CONTACTS[ctx.match[1]].text);
            }
        });
    }
}

