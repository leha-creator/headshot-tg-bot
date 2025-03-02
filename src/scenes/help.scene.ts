import {composeWizardScene} from "../helpers/scene.servise";
import {model} from 'mongoose';
import {ConfigService} from "../config/configService";
import {HelpMessageSchema} from "../Models/HelpMessage.model";

const configService = ConfigService.getInstance();

export const helpScene = composeWizardScene(
    async (ctx) => {
        ctx.wizard.state.address = null;
        ctx.reply('Выберите клуб, по которому хотели бы создать обращение', {
            reply_markup: {
                keyboard: [
                    [{text: "Ливанова"}, {text: "Гончарова"}],
                    [{text: "Рябикова"}, {text: "40 летия победы"}],
                    [{text: "Димитровград Ленина"}],
                ]
            },
        });
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (ctx.message.text !== undefined) {
            ctx.wizard.state.address = ctx.message.text;
        } else {
            return ctx.wizard.steps[0](ctx);
        }

        ctx.reply('Теперь опишите вашу проблему. Администратор ответит в ближайшее время');
        return ctx.wizard.next();
    },
    async (ctx: any, done: any) => {
        if (typeof ctx.message !== 'undefined' && typeof ctx.message.text !== 'undefined') {
            ctx.telegram.copyMessage(configService.get('HEADSHOT_HELP_GROUP_ID'), ctx.message.from.id, ctx.message.message_id).then((textMessage: any) => {
                const HelpMessage = model("HelpMessage", HelpMessageSchema);
                HelpMessage.create({
                    chat_id: ctx.message.chat.id,
                    original_message_id: ctx.message.message_id,
                    message_id: textMessage.message_id,
                    address: ctx.wizard.state.address
                });
            });
        }

        return done();
    },
);