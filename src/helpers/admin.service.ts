import * as fs from 'fs';
import {logger} from './logger';
import {model} from "mongoose";
import {MessageSchema} from "../Models/Message.model";
import {IUser, UserSchema} from "../Models/User.model";
import {ConfigService} from "../config/configService";

const configService = ConfigService.getInstance();

export const USER_BONUS_QUANTITY = 150;
export const USER_REF_BONUS_QUANTITY = 100;
export const USER_JOIN_BY_REF_BONUS_QUANTITY = 250;

export class AdminService {
    private static instance: AdminService;
    private readonly admins: number[] = [];
    private path = 'admin.json';

    private constructor() {
        try {
            const adminsFile = fs.readFileSync(this.path, 'utf8');
            this.admins = JSON.parse(adminsFile);
        } catch (e) {
            console.log('Error reading file:', e);
            console.log(e);
        }
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }

        this.instance = new AdminService();
        return this.instance;
    }

    getAdmins() {
        return this.admins;
    }

    addAdmin(id: number) {
        if (this.admins.includes(id)) return;

        this.admins.push(id);
        const adminsJson = JSON.stringify(this.admins);

        this.saveJson(adminsJson);
    }

    deleteAdmin(id: number) {
        const index = this.admins.indexOf(id);
        if (index !== -1) {
            this.admins.splice(index, 1);
        }

        const adminsJson = JSON.stringify(this.admins);
        this.saveJson(adminsJson);
    }

    isAdmin(id: number): boolean {
        return this.admins.includes(id);
    }

    private saveJson(json: string) {
        fs.writeFile(this.path, json, (err) => {
            if (err) {
                logger.info('Error writing file:', err);
                console.log('Error writing file:', err);
            } else {
                logger.info('Successfully wrote file');
                console.log('Successfully wrote file');
            }
        });
    }

    static async sendMessagesToAdminOnSubscribe(user: IUser, ref_user: IUser | null, ctx) {
        const Message = model("Message", MessageSchema);
        const isMessageExist = await Message.findOne({chat_id: user.chat_id});
        if (isMessageExist && isMessageExist.message_id) {
            return;
        }

        let balance = USER_BONUS_QUANTITY;
        let message = "❗️Новый пользователь:\n" +
            "\n" +
            "Номер: " + user.phone + "\n" +
            "ID: @" + user.name + "\n" +
            "Город: " + (user.city ?? 'Не указан') + "\n" +
            "Начислить бонусов: " + balance + "\n";

        if (ref_user && ref_user.ref_code !== undefined) {
            balance = USER_JOIN_BY_REF_BONUS_QUANTITY;
            message = "❗️Новый пользователь по приглашению:\n" +
                "\n" +
                "Номер: " + user.phone + "\n" +
                "ID: @" + user.name + "\n" +
                "Город: " + (user.city ?? 'Не указан') + "\n" +
                "Начислить бонусов: " + balance + "\n";
            const admin_message = "❗ Пригласивший пользователь:\n" +
                "Номер: " + ref_user.phone + "\n" +
                "ID: @" + ref_user.name + "\n" +
                "Город: " + (ref_user.city ?? 'Не указан') + "\n" +
                "Начислить бонусов: " + USER_REF_BONUS_QUANTITY + "\n";
            setTimeout(() => {
                ctx.telegram.sendMessage(configService.get('HEADSHOT_ADMIN_GROUP_ID'), admin_message, {
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
                    Message.create({
                        chat_id: user.chat_id,
                        referral_chat_id: ref_user.chat_id,
                        message_id: textMessage.message_id,
                        balance: USER_REF_BONUS_QUANTITY,
                        is_referral_message: true
                    });
                });
            }, 1000);
        }

        ctx.telegram.sendMessage(configService.get('HEADSHOT_ADMIN_GROUP_ID'), message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Начислено",
                            callback_data: 'bonuses_accrued',
                        },
                        {
                            text: "❌ Не зарегистрирован",
                            callback_data: 'user_not_registered',
                        },
                    ],
                ],
            },
        }).then((textMessage: any) => {
            const Message = model("Message", MessageSchema);
            Message.create({chat_id: user.chat_id, message_id: textMessage.message_id, balance: balance});
        })
    }

    static async sendMessagesToAdminOnSnakeWin(chat_id: number, bonus: any, ctx ) {
        const User = model("User", UserSchema);
        const user = await User.findOne({chat_id: chat_id});

        if(!user) {
            logger.info({
                chat_id: chat_id,
                score: bonus.bonusScore,
                message: 'Cannot send message to admin page. User is not found',
            })

            return
        }

        const message = "🐍Выигрыш в \"Змейке\":\n" +
            "\n" +
            "Номер: " + user.phone + "\n" +
            "ID: @" + user.name + "\n" +
            "Город: " + (user.city ?? 'Не указан') + "\n" +
            "Начислить бонусов: " + bonus.bonusScore;

        ctx.telegram.sendMessage(configService.get('HEADSHOT_ADMIN_GROUP_ID'), message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Начислено",
                            callback_data: 'snake-bonuses-accrued-' + bonus._id + '-' + user.chat_id,
                        },
                    ],
                ],
            },
        })
    }

    static sendMessagesToAdminOnChestWin(user: IUser, code: number, ctx, box_id: string, ) {
        const message = "❗Выигрыш в \"Рундуке\":\n" +
            "\n" +
            "Номер: " + user.phone + "\n" +
            "ID: @" + user.name + "\n" +
            "Город: " + (user.city ?? 'Не указан') + "\n" +
            "Начислить бонусов: " + code;

        ctx.telegram.sendMessage(configService.get('HEADSHOT_ADMIN_GROUP_ID'), message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Начислено",
                            callback_data: 'chest-bonuses-accrued-' + box_id + '-' + user.chat_id,
                        },
                    ],
                ],
            },
        })
    }

    static async setMessageProcessed(message_id: number, is_bonus_accrued = false) {
        const Message = model("Message", MessageSchema);
        const message = await Message.findOne({message_id: message_id});
        if (message) {
            message.is_processed = true;
            message.is_bonus_accrued = is_bonus_accrued;
            await message.updateOne(message);
        }
    }
}