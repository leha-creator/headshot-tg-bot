import {composeWizardScene} from "../helpers/scene.servise";
import {model} from 'mongoose';
import {ConfigService} from "../config/configService";
import {HelpMessageSchema} from "../Models/HelpMessage.model";
import {escapeText} from "../helpers/domain.service";
import {UserSchema} from "../Models/User.model";

const configService = ConfigService.getInstance();

const CLUBS = {
    1: "Ливанова",
    2: "Гончарова",
    3: "Рябикова",
    4: "40 летия победы",
    5: "Димитровград Ленина"
}

export const helpScene = composeWizardScene(
    async (ctx) => {
        ctx.wizard.state.address = ctx.session.addres ?? null;
        if (!ctx.wizard.state.address || CLUBS[ctx.wizard.state.address] == undefined) {
            const inline_keyboard: Array<Array<NonNullable<unknown>>> = [[]];
            for (const [key, value] of Object.entries(CLUBS)) {
                inline_keyboard[inline_keyboard.length-1].push({text: value, callback_data: 'select-club-' + key})
                if (inline_keyboard[inline_keyboard.length-1].length > 1) {
                    inline_keyboard.push([]);
                }
            }

            ctx.reply('Выберите клуб, по которому хотели бы создать обращение', {
                reply_markup: {
                    inline_keyboard: inline_keyboard
                },
            });
        } else {
            ctx.wizard.cursor = 1;
            return ctx.wizard.steps[1](ctx);
        }

        return ctx.wizard.next();
    },
    async (ctx) => {
        if ((!ctx.wizard.state.address || CLUBS[ctx.wizard.state.address] == undefined) && (ctx.message == undefined || ctx.message.text == undefined)) {
            ctx.wizard.cursor = 0;
            return ctx.wizard.steps[0](ctx);
        } else if (!ctx.wizard.state.address) {
            ctx.wizard.state.address = ctx.message.text;
        }

        ctx.reply('Теперь опишите вашу проблему. Администратор ответит в ближайшее время');
        return ctx.wizard.next();
    },
    async (ctx: any, done: any) => {
        if (typeof ctx.message !== 'undefined' && ctx.message.text !== undefined && ctx.wizard.state.address) {
            const User = model("User", UserSchema);
            const user = await User.findOne({chat_id: ctx.message.chat.id});
            if (user) {
                ctx.session.addres = ctx.wizard.state.address;
                const phone = user.phone == undefined ? 'Не указан' : escapeText(user.phone.toString());
                const text = `👤 Пользователь: ` + user.name + `\n📞 Номер телефона: ` + phone +  `\n🏢 Клуб: ` + escapeText(CLUBS[ctx.wizard.state.address]) + `\n📝 Текст обращения: ` + escapeText(ctx.message.text)
                ctx.telegram.sendMessage(configService.get('HEADSHOT_HELP_GROUP_ID'), text).then((textMessage: any) => {
                    const HelpMessage = model("HelpMessage", HelpMessageSchema);
                    HelpMessage.create({
                        chat_id: ctx.message.chat.id,
                        original_message_id: ctx.message.message_id,
                        message_id: textMessage.message_id,
                        address: ctx.wizard.state.address
                    });
                });
            }
            ctx.reply('Администратор получил ваше сообщение и ответит в ближайшее время');
        } else {
            ctx.reply('Произошла ошибка, попробуйте ещё раз');
        }

        return done();
    },
);