import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {ACTIONS} from "../scenes/current_actions.scene";
import {CLUB_CONTACTS} from "../scenes/contacts.scene";

export class ContactSelectClubAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^contacts-select-club-(\d+)$/, async (ctx) => {
            if (ACTIONS[ctx.match[1]] !== undefined) {
                await ctx.reply(CLUB_CONTACTS[ctx.match[1]].text);
            }
        });
    }
}

