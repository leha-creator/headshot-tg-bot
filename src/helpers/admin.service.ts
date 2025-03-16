import * as fs from 'fs';
import {logger} from './logger';
import {model} from "mongoose";
import {MessageSchema} from "../Models/Message.model";
import {IUser} from "../Models/User.model";
import {ConfigService} from "../config/configService";

const configService = ConfigService.getInstance();

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

    static sendMessagesToAdminOnSubscribe(user: IUser, ref_user: IUser | null, ctx) {
        let message = "❗️Новый пользователь:\n" +
            "\n" +
            "Номер: " + user.phone + "\n" +
            "ID: @" + user.name + "\n" +
            "Город: " + (user.city ?? 'Не указан') + "\n" +
            "Начислить бонусов: 300\n";
        let balance = 300;

        if (ref_user && ref_user.ref_code !== undefined) {
            message = "❗️Новый пользователь по приглашению:\n" +
                "\n" +
                "Номер: " + user.phone + "\n" +
                "ID: @" + user.name + "\n" +
                "Город: " + (user.city ?? 'Не указан') + "\n" +
                "Начислить бонусов: 450\n";
            balance = 450;
            const admin_message = "❗ Пригласивший пользователь:\n" +
                "Номер: " + ref_user.phone + "\n" +
                "ID: @" + ref_user.name + "\n" +
                "Город: " + (ref_user.city ?? 'Не указан') + "\n" +
                "Начислить бонусов: 150\n";
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
                    const Message = model("Message", MessageSchema);
                    Message.create({
                        chat_id: user.chat_id,
                        referral_chat_id: ref_user.chat_id,
                        message_id: textMessage.message_id,
                        balance: 150,
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

    static async setMessageProcessed(message_id: number) {
        const Message = model("Message", MessageSchema);
        const message = await Message.findOne({message_id: message_id});
        if (message) {
            message.is_processed = true;
            await message.updateOne(message);
        }
    }
}