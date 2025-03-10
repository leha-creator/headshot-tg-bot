import {composeWizardScene} from "../helpers/scene.servise";
import {IUser, UserSchema} from "../Models/User.model";
import {model} from 'mongoose';
import crypto from 'crypto'
import {escapeText} from "../helpers/domain.service";
import {logger} from "../helpers/logger";
import {AdminService, USER_BONUS_QUANTITY, USER_JOIN_BY_REF_BONUS_QUANTITY} from "../helpers/admin.service";
import {ConfigService} from "../config/configService";
const configService = ConfigService.getInstance();

export const registerScene = composeWizardScene(
    async (ctx) => {
        ctx.wizard.state.phone = null;
        let ref_user_name = '';
        const ref_user_code = ctx.session.ref_code;
        if (ref_user_code !== undefined) {
            const User = model("User", UserSchema);
            const ref_user = await User.findOne({ref_code: ref_user_code});
            if (ref_user && ref_user.ref_code !== undefined) {
                ref_user_name = ref_user.name;
            }
        }
        const ref_code = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();
        await updateOrInsert({
            chat_id: ctx.message.chat.id,
            name: ctx.message.from.username,
            ref_code: ref_code,
            city: undefined,
            join_code: ref_user_code,
            is_bonus_accrued: false,
            is_subscribed: false
        });

        try {
            let message = 'Хэй, геймер\\! 👋 Я бот [HEADSHOT]((https://t.me/headshot_cyber)\\. Регайся, и бонус твой\\! 💰 Кнопка внизу 👇';
            if (ref_user_name) {
                message = 'Привет\\! Ваш друг ' + escapeText('@' + ref_user_name) + ' пригласил вас в [HEADSHOT]((https://t.me/headshot_cyber), и это круто\\! 🎉 Зарегистрируйтесь, чтобы получить приветственный бонус \\+ еще ' + (USER_JOIN_BY_REF_BONUS_QUANTITY - USER_BONUS_QUANTITY) + ' бонусных рублей на свой счет\\! 👇';
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
    async (ctx: any) => {
        if (typeof ctx.message !== 'undefined' && typeof ctx.message.contact !== 'undefined') {
            if (ctx.message.contact.phone_number) {
                ctx.wizard.state.phone = ctx.message.contact.phone_number;
                ctx.reply('Выберите город:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: "Ульяновск", callback_data: "Ульяновск"}],
                            [{text: "Димитровград", callback_data: "Димитровград"}],
                        ]
                    }
                });
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

        return ctx.wizard.next();
    },
    async (ctx: any, done: () => any) => {
        if (typeof ctx.update.callback_query !== 'undefined') {
            console.log(ctx.update.callback_query.message.from);
            if (ctx.wizard.state.phone) {
                const ref_code = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();
                await updateOrInsert({
                    phone: ctx.wizard.state.phone,
                    chat_id: ctx.update.callback_query.from.id,
                    name: ctx.update.callback_query.from.username,
                    city: ctx.update.callback_query.data,
                    ref_code,
                    is_bonus_accrued: false,
                    is_subscribed: false,
                });

                const chat_id = ctx.update.callback_query.from.id;
                const User = model("User", UserSchema);
                const user = await User.findOne({chat_id: chat_id});
                if (user) {
                    const chat_member = await ctx.telegram.getChatMember(configService.get('HEADSHOT_CHANNEL_ID'), chat_id);
                    if (chat_member.status == 'member') {
                        const ref_user = await User.findOne({ref_code: user.join_code});
                        user.is_subscribed = true;
                        await updateOrInsert(user);
                        ctx.reply('Отлично! После проверки модератором мы вышлем вам сообщение о начислении бонуса.');
                        AdminService.sendMessagesToAdminOnSubscribe(user, ref_user, ctx);
                        return done();
                    }
                }
            }
        } else {
            ctx.reply('Произошла ошибка', {
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: "Попробовать ещё раз",
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