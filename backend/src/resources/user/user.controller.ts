import { Request, Response } from "express";
import { CreateUserDto } from "./user.types";
import { createUser } from "./user.service";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const index = async (req: Request, res: Response) => {}

const create = async (req : Request, res : Response ) => {

    const data = req.body as CreateUserDto;
    try {
        const user = await createUser(data)
        res.json(user); 
    }catch(err){
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ReasonPhrases.INTERNAL_SERVER_ERROR);
    }
}

export default {
    index,
    create
}







