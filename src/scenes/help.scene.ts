import {composeWizardScene} from "../helpers/scene.servise";
import {model} from 'mongoose';
import {ConfigService} from "../config/configService";
import {HelpMessageSchema} from "../Models/HelpMessage.model";
import {escapeText} from "../helpers/domain.service";
import {UserSchema} from "../Models/User.model";

const configService = ConfigService.getInstance();

export const helpScene = composeWizardScene(
    async (ctx) => {
        ctx.wizard.state.address = ctx.wizard.state.address ?? null;
        if (!ctx.wizard.state.address) {
            ctx.reply('Выберите клуб, по которому хотели бы создать обращение', {
                reply_markup: {
                    keyboard: [
                        [{text: "Ливанова"}, {text: "Гончарова"}],
                        [{text: "Рябикова"}, {text: "40 летия победы"}],
                        [{text: "Димитровград Ленина"}],
                    ]
                },
            });
        } else {
            return ctx.wizard.steps[1](ctx);
        }

        return ctx.wizard.next();
    },
    async (ctx) => {
        console.log(ctx.wizard.state.address);
        if (!ctx.wizard.state.address && (ctx.message == undefined || ctx.message.text == undefined)) {
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
                const phone = user.phone == undefined ? 'Не указан' : escapeText(user.phone.toString());
                const text = `👤 Пользователь: ` + user.name + `\n📞 Номер телефона: ` + phone +  `\n🏢 Клуб: ` + escapeText(ctx.wizard.state.address) + `\n📝 Текст обращения: ` + escapeText(ctx.message.text)
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
        } else {
            ctx.reply('Произошла ошибка, попробуйте ещё раз');
        }

        return done();
    },
);