import {composeWizardScene} from "../helpers/scene.servise";
import {IUser, UserSchema} from "../Models/User.model";
import {model} from 'mongoose';
import crypto from 'crypto'
import {escapeText} from "../helpers/domain.service";
import {logger} from "../helpers/logger";
import {MessageSchema} from "../Models/Message.model";

export const registerScene = composeWizardScene(
    async (ctx) => {
        let join_code = '';
        let ref_user_name = '';
        const ref_user_code = ctx.session.ref_code;
        if (ref_user_code !== undefined) {
            const User = model("User", UserSchema);
            const ref_user = await User.findOne({ref_code: ref_user_code});
            if (ref_user && ref_user.ref_code !== undefined) {
                join_code = ref_user.ref_code;
                ref_user_name = ref_user.name;
            }
        }
        const ref_code = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();

        await updateOrInsert({
            chat_id: ctx.message.chat.id,
            name: ctx.message.from.username,
            ref_code: ref_code,
            join_code: join_code
        });

        try {
            let message = 'Хэй, геймер\\! 👋 Я бот [HEADSHOT]((https://t.me/headshot_cyber)\\. Регайся, и бонус твой\\! 💰 Кнопка внизу 👇';
            if (ref_user_name) {
                message = 'Привет\\! Ваш друг ' + escapeText('@' + ref_user_name) + ' пригласил вас в [HEADSHOT]((https://t.me/headshot_cyber), и это круто\\! 🎉 Зарегистрируйтесь, чтобы получить приветственный бонус \\+ еще 100 бонусных рублей на свой счет\\! 👇';
            }
            ctx.reply(message, {
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: "Зарегистрироваться",
                                callback_data: 'enter_register',
                                request_contact: true,
                            },
                        ],
                    ],
                },
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
            });
        } catch (e: any) {
            logger.info(e.message);
        }
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

                const chat_id = ctx.message.chat.id;
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: chat_id});
                if (user) {
                    const chat_member = await ctx.telegram.getChatMember(-1001634058732, chat_id);
                    if (chat_member.status == 'member') {
                        const User = model("User", UserSchema);
                        const ref_user = await User.findOne({ref_code: user.join_code});
                        ctx.reply(`Поздравляем! Вы успешно подписались! 300 рублей скоро зачислятся на ваш бонусный счет. Пригласите друга по этой ссылке и получите еще 300 бонусных рублей, а ваш друг — 100₽! Реферальная ссылка: https://t.me/headshot_club_bot?start=` + user.ref_code);
                        if (ref_user && ref_user.ref_code !== undefined) {
                            ctx.telegram.sendMessage(ref_user.chat_id, 'Ура! 🎉 Ваш друг @' + user.name + ' зарегистрировался! 300 рублей скоро зачислятся на ваш бонусный счёт! 💰');
                        }

                        let message = "❗️Новый пользователь:\n" +
                            "\n" +
                            "Номер: " + user.phone + "\n" +
                            "ID: @" + user.name + "\n" +
                            "Начислить бонусов: 300\n";
                        let balance = 300;
                        if (ref_user && ref_user.ref_code !== undefined) {
                            message = "❗️Новый пользователь по приглашению:\n" +
                                "\n" +
                                "Номер: " + user.phone + "\n" +
                                "ID: @" + user.name + "\n" +
                                "Начислить бонусов: 450\n";
                            balance = 450;
                            const admin_message = "❗ Пригласивший пользователь:\n" +
                                "Номер: " + ref_user.phone + "\n" +
                                "ID: @" + ref_user.name + "\n" +
                                "Начислить бонусов: 150\n";
                            ctx.telegram.sendMessage(-4610945060, admin_message, {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: "✅ Начислено",
                                                callback_data: 'bonuses_accrued',
                                            },
                                        ],
                                    ],
                                },
                            }).then((textMessage: any) => {
                                const Message = model("Message", MessageSchema);
                                Message.create({chat_id: ref_user.chat_id, message_id: textMessage.message_id, balance: 150});
                            });
                        }
                        ctx.telegram.sendMessage(-4610945060, message, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "✅ Начислено",
                                            callback_data: 'bonuses_accrued',
                                        },
                                    ],
                                ],
                            },
                        }).then((textMessage: any) => {
                            const Message = model("Message", MessageSchema);
                            Message.create({chat_id: chat_id, message_id: textMessage.message_id, balance: balance});
                        });
                        return done();
                    }
                }
            }
        } else {
            ctx.reply('Нет телефона', {
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: "Отправить телефон",
                                request_contact: true,
                            },
                        ],
                    ],
                },
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
            });

            return ctx.wizard.steps[0](ctx);
        }

        ctx.reply('Отлично\\! Ваш бонус ждет вас после подписки на наш [канал](https://t.me/headshot_cyber) с еженедельными эксклюзивными акциями и игровыми новостями\\!', {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Перейти и подписаться", url: 'https://t.me/headshot_cyber'}],
                    [{text: "Проверить", callback_data: "check"}],
                ]
            },
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        });

        ctx.wizard.next();
        return done();
    },
);

async function updateOrInsert(user_data: IUser) {
    const User = model("User", UserSchema);
    const user = await User.findOne({chat_id: user_data.chat_id});
    if (user) {
        await user.updateOne(user_data);
    } else {
        await User.create(user_data);
    }
}