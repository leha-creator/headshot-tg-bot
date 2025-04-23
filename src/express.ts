import express, {Express} from "express";
import {model} from "mongoose";
import {UserSchema} from "./Models/User.model";
import {MessageSchema} from "./Models/Message.model";
import {AdminService} from "./helpers/admin.service";
import {Bot} from "./bot";
import {ConfigService} from "./config/configService";
import {SnakeBonusSchema, ISnakeBonus} from "./Models/SnakeBonus.model";
import cors, {CorsOptions} from 'cors';
import ExcelJS from 'exceljs';

interface CombinedData {
    chat_id: number;
    name: string | undefined;
    city: string | undefined;
    phone: number | undefined;
    balance: number;
    is_bonus_accrued: boolean;
}

export class ExpressServer {
    expressApp: Express | undefined;

    constructor(private readonly bot: Bot, private readonly configService: ConfigService) {
        this.configService = configService;
        this.bot = bot;
    }

    async init() {
        this.expressApp = express();
        this.expressApp.set('view engine', 'html');

        this.expressApp.use(express.json());

        const corsOptions: CorsOptions = {
            origin: '*',
            methods: ['get', 'post'],
            optionsSuccessStatus: 200,
        };

        this.expressApp.use(cors(corsOptions));
        this.expressApp.use(express.static(__dirname + '/../pages'));

        this.expressApp.listen(8443, () => console.log(`Running on port 8443`));

        await this.stats();
        await this.statsFile();
        await this.snake();
    }

    async stats() {
        if (this.expressApp == undefined) {
            return null;
        }

        this.expressApp.post('/stats', async (request, response) => {
            if (!request.body.start_date) {
                response.statusCode = 400;
                return response.json({start_date: "start_date is required"});
            }
            if (!request.body.end_date) {
                response.statusCode = 400;
                return response.json({end_date: "end_date is required"});
            }
            const startDate = request.body.start_date + "T00:00:00";
            const endDate = request.body.end_date + "T23:59:59";

            const User = model("User", UserSchema);
            const pressed_start = await User.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            const with_phone = await User.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                phone: {$ne: undefined}
            });

            const with_join_code = await User.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                $and: [
                    {join_code: {$ne: '0'}},
                    {join_code: {$ne: ''}}
                ]
            });

            const without_join_code = pressed_start - with_join_code;

            const registered = await User.find({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                is_subscribed: true
            });

            const Message = model("Message", MessageSchema);
            const bonuses = await Message.aggregate([
                {
                    "$match": {
                        "createdAt": {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        },
                    }
                },
                {
                    "$group": {
                        "_id": {"$toLower": "$balance"},
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "counts": {
                            "$push": {"k": "$_id", "v": "$count"}
                        }
                    }
                },
                {
                    "$replaceRoot": {
                        "newRoot": {"$arrayToObject": "$counts"}
                    }
                }
            ]);
            let blocked = 0;
            let unsubscribed = 0;
            for (const user of registered) {
                try {
                    const chat_member = await this.bot.bot.telegram.getChatMember(this.configService.get('HEADSHOT_CHANNEL_ID'), user.chat_id);
                    if (chat_member == undefined || chat_member.status != 'member') {
                        unsubscribed += 1;
                    }
                } catch (e) {
                    blocked += 1;
                }
            }

            const result = {
                pressed_start: pressed_start,
                with_phone: with_phone,
                with_join_code: with_join_code,
                without_join_code: without_join_code,
                registered: registered.length,
                unsubscribed: unsubscribed,
                blocked: blocked,
                bonuses: bonuses,
            }

            return response.json(result);
        });
    }

    async statsFile() {
        if (this.expressApp == undefined) {
            return null;
        }

        this.expressApp.get('/download-users-messages', async (request, response) => {
            try {
                if (!request.query.start_date) {
                    response.statusCode = 400;
                    return response.json({start_date: "required"});
                }

                if (!request.query.end_date) {
                    response.statusCode = 400;
                    return response.json({end_date: "required"});
                }

                const startDate = request.query.start_date + "T00:00:00";
                const endDate = request.query.end_date + "T23:59:59";

                const combinedData = await this.getCombinedUserMessagesData(startDate, endDate);
                const excelBuffer = await this.createExcelFile(combinedData);

                response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                response.setHeader('Content-Disposition', 'attachment; filename=users_messages.xlsx');
                response.send(excelBuffer);
            } catch (error) {
                console.error('Error generating Excel file:', error);
                response.status(500).send('Error generating Excel file');
            }
        });
    }

    async snake() {
        if (this.expressApp == undefined) {
            return null;
        }

        this.expressApp.get('/snake-game/timer/', async (request, response) => {
            const chatID = request.query.chat_id;

            if (!chatID) {
                response.statusCode = 400;
                return response.json({"message": {chatID: "chat id is required"}});
            }

            const SnakeBonus = model("SnakeBonus", SnakeBonusSchema);
            const snakeBonus: any = await SnakeBonus.findOne({
                createdAt: {$gt: new Date().getTime() - 72 * 60 * 60 * 1000},
                bonusScore: {$ne: 0},
                chat_id: chatID,
            }).sort('-createdAt');

            if (!snakeBonus) {
                return response.json({
                    status: 'ok',
                    result: {
                        timer: false
                    }
                });
            }

            const currentDate = new Date();
            const bonusDate = new Date(snakeBonus.createdAt)
            const datesDiff = currentDate.getTime() - (bonusDate.getTime() + 72 * 60 * 60 * 1000);

            if (datesDiff >= 0) {
                return response.json({
                    status: 'ok',
                    result: {
                        timer: false
                    }
                });
            }

            return response.json({
                status: 'ok',
                result: {
                    timer: datesDiff
                }
            });
        });

        this.expressApp.post('/snake-game/end', async (request, response) => {
            if (!request.body.chat_id) {
                response.statusCode = 400;
                return response.json({"message": {chatID: "chat id is required"}});
            }

            if (!request.body.score) {
                response.statusCode = 400;
                return response.json({"message": {score: "score is required"}});
            }
            const SnakeBonus = model("SnakeBonus", SnakeBonusSchema);

            const saveData: ISnakeBonus = {
                chat_id: request.body.chat_id,
                score: request.body.score,
                bonusScore: request.body.bonusScore && request.body.bonusScore != 'null' ? Number(request.body.bonusScore) : 0,
            }

            const currentBonusScore = await SnakeBonus.findOne({
                createdAt: {$gt: new Date().getTime() - 72 * 60 * 60 * 1000},
                bonusScore: {$ne: 0},
                chat_id: saveData.chat_id
            });

            const snakeBonus = await SnakeBonus.create(saveData)

            if (!currentBonusScore && saveData.bonusScore && typeof saveData.bonusScore === 'number') {
                await AdminService.sendMessagesToAdminOnSnakeWin(saveData.chat_id, snakeBonus, this.bot.bot);
            }

            return response.json({
                status: 'ok',
                result: {
                    message: 'Бонусы записаны на ваш счет. Можете использовать их в наших клубах'
                }
            });
        });
    }

    async getCombinedUserMessagesData(startDate: string, endDate: string) {
        // Получаем пользователей
        const User = model("User", UserSchema);
        const users = await User.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
        });

        // Получаем сообщения
        const Message = model("Message", MessageSchema);
        const messages = await Message.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
        });

        // Группируем сообщения по chat_id
        const messagesByChatId: Record<number, any> = {};
        for (const message of messages) {
            if (!messagesByChatId[message.chat_id]) {
                messagesByChatId[message.chat_id] = [];
            }

            messagesByChatId[message.chat_id].push(message);
        }

        // Объединяем данные
        const combinedData: CombinedData[] = [];
        for (const user of users) {
            const userMessages = messagesByChatId[user.chat_id] || [];
            for (const message of userMessages) {
                combinedData.push({
                    chat_id: user.chat_id,
                    name: user.name,
                    city: user.city,
                    phone: user.phone,
                    balance: message.balance,
                    is_bonus_accrued: message.is_bonus_accrued,
                });
            }

        }

        return combinedData;
    }

    async createExcelFile(data: CombinedData[]) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users with Messages');

        // Заголовки столбцов
        worksheet.columns = [
            {header: 'Chat ID', key: 'chat_id', width: 15},
            {header: 'Name', key: 'name', width: 20},
            {header: 'City', key: 'city', width: 15},
            {header: 'Phone', key: 'phone', width: 15},
            {header: 'Balance', key: 'balance', width: 20},
            {header: 'Bonus accrued', key: 'bonus_flags', width: 15},
        ];

        // Добавляем данные
        data.forEach(row => {
            worksheet.addRow({
                chat_id: row.chat_id,
                name: row.name,
                city: row.city,
                phone: row.phone,
                balance: row.balance,
                bonus_flags: row.is_bonus_accrued ? 'Начислено' : '',
            });
        });

        // Форматирование заголовков
        worksheet.getRow(1).eachCell(cell => {
            cell.font = {bold: true};
        });

        // Возвращаем буфер
        return await workbook.xlsx.writeBuffer();
    }
}
