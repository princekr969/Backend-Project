// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env",
})

connectDB()
.then(() => {
    app.on("err", (err) => {
        console.log("ERR: ",err)
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is run on port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("DB connection Failed !!", err);
});



















/*const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.log("ERROR: ",error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listen on port: ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw error
    }
})()
*/