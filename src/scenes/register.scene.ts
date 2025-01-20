import {composeWizardScene} from "../helpers/scene.servise";
import {IUser, UserSchema} from "../Models/User.model";
import {model} from 'mongoose';
import crypto from 'crypto'

interface ISocial {
    name: string,
    link: string,
}

interface IKeyboardElement {
    text: string,
    callback_data: string
}

export const registerScene = composeWizardScene(
    (ctx) => {
        ctx.reply("Для регистрации нажмите на кнопку \"📱Отправить телефон\" в меню бота", {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "Отправить телефон",
                            request_contact: true,
                        },
                    ],
                ],
                one_time_keyboard: true,
            },
        });

        return ctx.wizard.next();
    },
    async (ctx: any, done: () => any) => {
        if (typeof ctx.message !== 'undefined' && typeof ctx.message.contact !== 'undefined') {
            if (ctx.message.contact.phone_number) {
                const ref_code = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();
                await updateOrInsert({
                    phone: ctx.message.contact.phone_number,
                    chat_id: ctx.message.chat.id,
                    name: ctx.message.from.username,
                    ref_code,
                });
            }
        } else {
            ctx.wizard.cursor = ctx.wizard.cursor - 1;
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        }

        ctx.reply('Спасибо, теперь подпишитесь на канал', {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Проверить", callback_data: "check"}],
                ]
            }
        });

        ctx.wizard.next();
        return done();
    },
);

async function updateOrInsert(user_data: IUser) {
    const User = model("User", UserSchema);
    const user = await User.findOne({chat_id: user_data.chat_id});
    if (user) {
        await User.updateOne(user_data);
    } else {
        await User.create(user_data);
    }

}

