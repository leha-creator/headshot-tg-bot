import {Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {Action} from "./action.class";
import {SnakeBonusSchema} from "../Models/SnakeBonus.model";
import {logger} from "../helpers/logger";

export class SnakeBonusAccruedAction extends Action {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/^snake-bonuses-accrued-([a-f0-9]+)-(\d+)$/, async (ctx: any) => {
            const snake_bonus_id = ctx.match[1];
            const chat_id = ctx.match[2];

            const SnakeBonus = model("SnakeBonus", SnakeBonusSchema);
            const snakeBonus =  await SnakeBonus.findOne({_id: snake_bonus_id});

            if (snakeBonus) {
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: chat_id});

                if (user) {
                    snakeBonus.is_bonus_accrued = true;
                    await snakeBonus.updateOne(snakeBonus);

                    await this.bot.telegram.editMessageText(
                        ctx.chat.id,
                        ctx.update.callback_query.message.message_id,
                        undefined,
                        '[Змейка] Пользователю ' + user.phone + ' зачислено ' + snakeBonus.bonusScore + ' бонусов ✅'
                    );
                }
                else{
                    logger.info({
                        chat_id: chat_id,
                        bonus_id: snake_bonus_id,
                        message: 'Cannot save user score. User is not found',
                    })
                }
            }
            else{
                logger.info({
                    chat_id: chat_id,
                    bonus_id: snake_bonus_id,
                    message: 'Cannot save user score. Snake bonus is not found',
                })
            }
        });
    }
}

