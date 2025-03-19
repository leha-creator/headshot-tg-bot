import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";
import {increaseBonusCounter} from "../helpers/counters.service";

export class StartCommand extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx: any, next: any) => {
            const parameters = ctx.update.message.text.split(' ');
            ctx.session.ref_code = parameters[1] ?? 0;

            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: ctx.message.chat.id});
            if (user) {
                const chat_id = ctx.update.message.from.id;
                await increaseBonusCounter(chat_id, 'start');

                await ctx.reply('Вы уже зарегистрированы');
            } else {
                await ctx.reply('🎮 Хэй, геймер! 👋\n' +
                    'Я — бот HEADSHOT, и я твой проводник в мир игр! У меня ты сможешь:\n' +
                    '🔑 Получать эксклюзивные промокоды и узнавать о скидках.\n' +
                    '💸 Проверять актуальный прайс в твоём клубе.\n' +
                    '🛠️ Быстро решать вопросы через тех.поддержку.\n' +
                    '🎁 Открывать ежедневный рундук и получать призы.\n' +
                    '🤑 А после регистрации — гарантированный бонус и бонусы за каждого приглашённого друга!');
                await ctx.scene.enter('register', {});
            }
            return await next();
        });
    }
}
