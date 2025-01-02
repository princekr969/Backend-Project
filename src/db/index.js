import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // const host = connectionInstance.connection.host;
        console.log(`\n MongoDB connected !! DB Host: ${process.env.PORT}`)
    } catch (error) {
        console.log(`MONGODB CONNECTION FAILED: ${error}`);
        process.exit(1);
    }
}

export default connectDB;