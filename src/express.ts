import express, {Express} from "express";
import {model} from "mongoose";
import {UserSchema} from "./Models/User.model";
import path from "node:path";
import {MessageSchema} from "./Models/Message.model";

export class ExpressServer {
    expressApp: Express | undefined;

    async init() {
        this.expressApp = express();
        this.expressApp.use(express.json());
        this.expressApp.listen(8443, () => console.log(`Running on port 8443`));
        this.expressApp.use(express.static(__dirname + '/../pages'));
        await this.stats()
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

            const registered = await User.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                is_subscribed: true
            });

            const Message = model("Message", MessageSchema);
            const bonuses = await Message.aggregate([
                { "$group": {
                        "_id": { "$toLower": "$balance" },
                        "count": { "$sum": 1 }
                    } },
                { "$group": {
                        "_id": null,
                        "counts": {
                            "$push": { "k": "$_id", "v": "$count" }
                        }
                    } },
                { "$replaceRoot": {
                        "newRoot": { "$arrayToObject": "$counts" }
                    } }
            ]);



            const result = {
                pressed_start: pressed_start,
                with_join_code: with_join_code,
                without_join_code: without_join_code,
                registered: registered,
                bonuses: bonuses,
            }

            return response.json(result);
        });
    }
}
