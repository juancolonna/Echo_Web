import { NextFunction, Request, Response } from "express";

import { UserTypes } from "../resources/userType/userType.constants";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const checkAuthorization = (req: Request, res: Response, next: NextFunction) => {

    if(req.session.userType && req.session.userType == UserTypes.ADMIN){
        return next();
    } else {
        res.status(StatusCodes.FORBIDDEN).json(ReasonPhrases.FORBIDDEN);
    }

};

export default checkAuthorization;