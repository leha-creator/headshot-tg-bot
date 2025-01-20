import { Context } from "telegraf";
import {SceneContext, SceneSession} from "telegraf/scenes";

export interface ISessionData {
    courseLike: boolean;
}

export interface IBotContext extends SceneContext, Context {
    session: ISessionData & SceneSession;
    from: any,
    message: any,
}