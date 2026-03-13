import { cleanEnv, num, port,url } from "envalid";
import dotenv from "dotenv";

dotenv.config({ quiet : true});

function getEnv(){
    return cleanEnv(process.env, {

        PORT: port({ default: 7788 }),
        BCRYPT_ROUNDS : num({ default: 10 }),
        FRONTEND_URL: url()
    })
}

export default getEnv;