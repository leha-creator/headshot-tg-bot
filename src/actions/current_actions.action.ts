import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {ACTIONS} from "../scenes/current_actions.scene";
import {increaseBonusCounter} from "../helpers/counters.service";

export class CurrentActionsAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('current-actions', async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'current-actions');

            await ctx.scene.enter('current-actions');
        });

        this.bot.action(/^action-select-(\d+)$/, async (ctx) => {
            const chat_id = ctx.update.callback_query.from.id;
            await increaseBonusCounter(chat_id, 'action-select-' + ctx.match[1]);

            if (ACTIONS[ctx.match[1]] !== undefined) {
                await ctx.replyWithPhoto(ACTIONS[ctx.match[1]].price_url);
            }
        });
    }
}

