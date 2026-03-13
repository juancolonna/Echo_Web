import { Request, Response } from 'express';
import { SignUpDto } from './auth.types';
import { createUser, getUser } from '../user/user.service';
import { UserTypes } from '../userType/userType.constants';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { checkCredentials } from './auth.service';
import { LoginDto } from './auth.types';



const signup = async (req: Request, res: Response) => {

    const data = req.body as SignUpDto;
    try {
        const user = await createUser({...data, userTypeId: UserTypes.CLIENT});
        res.json(user);
    }catch (err){
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ReasonPhrases.INTERNAL_SERVER_ERROR);
    }

}
const login= async (req: Request, res: Response) => {
    const data = req.body as LoginDto;
    try {
        const user = await checkCredentials(data);
        if (!user) return res.status(StatusCodes.UNAUTHORIZED).json(ReasonPhrases.UNAUTHORIZED);
        req.session.userType = user.userTypeId;
        req.session.userId = user.id;

        req.session.save((err) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ReasonPhrases.INTERNAL_SERVER_ERROR);
            }
            res.status(StatusCodes.OK).json({
                userId: user.id,
                userType: user.userTypeId,
                userName: user.name,
            });
        });

    }catch (err){
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ReasonPhrases.INTERNAL_SERVER_ERROR);
    }
}

const me = async (req: Request, res: Response) => {
    const user = await getUser(req.session.userId);
    if (user) {
        return res.status(StatusCodes.OK).json({
            userId: user.id,
            userType: user.userTypeId,
            userName: user.name,
        });
    } else{
        return res.status(StatusCodes.UNAUTHORIZED).json(ReasonPhrases.UNAUTHORIZED);
    }
}

const logout = async (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ReasonPhrases.INTERNAL_SERVER_ERROR);
        }
        res.clearCookie('connect.sid');
        res.status(StatusCodes.OK).json(ReasonPhrases.OK);
    });
}

const csrfToken = async (req: Request, res: Response) => {
    const token = (req as any).csrfToken?.();
    return res.status(StatusCodes.OK).json({ csrfToken: token });
}



export default {
  signup,
  login,
  logout,
    me,
    csrfToken
};
