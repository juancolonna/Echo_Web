import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";   
import { ReasonPhrases, StatusCodes } from "http-status-codes";


const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).send(ReasonPhrases.BAD_REQUEST);
        }
        next();
    };
};

export default validate;