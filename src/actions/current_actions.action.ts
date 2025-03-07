import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {Action} from "./action.class";
import {ACTIONS} from "../scenes/current_actions.scene";

export class CurrentActionsAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('current-actions', (ctx) => {
            ctx.scene.enter('current-actions');
        });

        this.bot.action(/^action-select-(\d+)$/, async (ctx) => {
            if (ACTIONS[ctx.match[1]] !== undefined) {
                await ctx.replyWithPhoto(ACTIONS[ctx.match[1]].price_url);
            }
        });
    }
}

