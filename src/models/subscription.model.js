import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema = Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    channel: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
}, {timeStamps: true});

export const subscription = mongoose.model("subscription", subscriptionSchema)