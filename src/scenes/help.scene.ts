import {composeWizardScene} from "../helpers/scene.servise";
import {model} from 'mongoose';
import {ConfigService} from "../config/configService";
import {HelpMessageSchema} from "../Models/HelpMessage.model";

const configService = ConfigService.getInstance();

export const helpScene = composeWizardScene(
    async (ctx) => {
        ctx.reply('Опишите вашу проблему в этом сообщении. Оно будет передано модератору, и вы получите ответ в ближайшее время.');
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
                });
            });
        }

        return done();
    },
);