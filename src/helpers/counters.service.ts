import {model} from "mongoose";
import {UserSchema} from "../Models/User.model";

export async function increaseBonusCounter(chat_id: number, button_name: string) {
    const User = model("User", UserSchema);
    const user = await User.findOne({chat_id: chat_id});
    if (user) {
        const key = button_name + '_counter';

        if (user.counters == undefined) {
            user.set('counters.' + key, 1)
        } else {
            user.set('counters.' + key, user.counters[key] !== undefined ? user.counters[key] + 1 : 1);
        }

        await user.save()
    }
}