import {ConfigService} from "./config/configService";
import {logger} from "./helpers/logger";
import {AdminService} from "./helpers/admin.service";
import {connect} from 'mongoose';
import {Bot} from "./bot";
import express from "express";
import {ExpressServer} from "./express";

const configService = ConfigService.getInstance();
const adminService = AdminService.getInstance();
const bot = new Bot(configService, adminService);
const expressServer = new ExpressServer();

const start = async () => {
    await expressServer.init();
    await bot.init();
    logger.info('app started');
};

async function connectMongo() {
    const url = "mongodb://127.0.0.1:27017/";
    try {
        await connect(url);
    } catch (err) {
        console.log("Возникла ошибка");
        console.log(err);
    }
}

connectMongo().then(async () => {
    await start();
});
