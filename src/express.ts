import express, {Express} from "express";
import {model} from "mongoose";
import {UserSchema} from "./Models/User.model";
import {MessageSchema} from "./Models/Message.model";
import {IConfigServise} from "./config/config.interface";
import {AdminService} from "./helpers/admin.service";
import {Telegraf} from "telegraf";
import {IBotContext} from "./context/context.interface";
import LocalSession from "telegraf-session-local";
import {Bot} from "./bot";
import {ConfigService} from "./config/configService";
import {SnakeBonusSchema, ISnakeBonus} from "./Models/SnakeBonus.model";
import cors, {CorsOptions} from 'cors'
import {type} from "node:os";

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

        const corsOptions:CorsOptions = {
            origin: '*',
            methods:['get', 'post'],
            optionsSuccessStatus: 200,
        };

        this.expressApp.use(cors(corsOptions));
        this.expressApp.use(express.static(__dirname + '/../pages'));

        this.expressApp.listen(8443, 'localhost', () => console.log(`Running on port 8443`));

        await this.stats()
        await this.snake()
    }

    async stats() {
        if (this.expressApp == undefined) {
            return null;
        }

        this.expressApp.post('/stats', async (request, response) => {
            if (!request.body.start_date) {
                response.statusCode = 400;
                return response.json({"text": {chatId: "start_date is required"}});
            }

            if (!request.body.end_date) {
                response.statusCode = 400;
                return response.json({"text": {chatId: "start_date is required"}});
            }
            const startDate = request.body.start_date;
            const endDate = request.body.end_date;

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
                join_code: {$ne: '0'}
            });

            const without_join_code = await User.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                join_code: '0'
            });

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

    async snake() {
        if (this.expressApp == undefined) {
            return null;
        }

        this.expressApp.get('/snake-game/timer/', async (request, response) => {
            const chatID = request.query.chat_id;

            if(!chatID) {
                response.statusCode = 400;
                return response.json({"message": {chatID: "chat id is required"}});
            }

            const SnakeBonus = model("SnakeBonus", SnakeBonusSchema);
            const snakeBonus:any = await SnakeBonus.findOne({
                createdAt: {$gt: new Date().getTime() - 72 * 60 * 60 * 1000},
                bonusScore: {$ne: 0},
                chat_id: chatID,
            }).sort('-createdAt');

            if(!snakeBonus){
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

            if(datesDiff >= 0){
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
            if(!request.body.chat_id) {
                response.statusCode = 400;
                return response.json({"message": {chatID: "chat id is required"}});
            }

            if(!request.body.score) {
                response.statusCode = 400;
                return response.json({"message": {score: "score is required"}});
            }
            const SnakeBonus = model("SnakeBonus", SnakeBonusSchema);

            const saveData:ISnakeBonus = {
                chat_id: request.body.chat_id,
                score: request.body.score,
                bonusScore: request.body.bonusScore || 0,
            }

            const currentBonusScore = await SnakeBonus.findOne({
                createdAt: {$gt: new Date().getTime() - 72 * 60 * 60 * 1000},
                bonusScore: {$ne: 0},
                chat_id: saveData.chat_id
            });

            const snakeBonus = await SnakeBonus.create(saveData)

            if(!currentBonusScore && saveData.bonusScore && typeof saveData.bonusScore === 'number'){
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
}
