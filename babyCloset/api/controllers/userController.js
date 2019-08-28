const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const db = require('../../modules/utils/db/pool');
const crypto = require('crypto-promise');
const jwt = require('../../modules/utils/security/jwt');

// 이름, 아이디, 비밀번호, 닉네임

module.exports = {
    SignUp: async(req, res) => {
        let duplicate = false;
        if(!req.body.id || !req.body.name || !req.body.password || !req.body.nickname)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else{
            const getAllUserQuery = 'SELECT userId, nickname FROM user';
            const getAllUserResult = await db.queryParam_None(getAllUserQuery);
            if (!getAllUserResult) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.USER_SELECT_FAIL));
            } else {
                for(i=0; i<getAllUserResult.length ;i++)
                {
                    user = getAllUserResult[i];
                    if(user.userId == req.body.id)
                    {
                        res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.USER_ALREADY_EXISTS));
                        duplicate = true;
                        break;
                    }
                }
                for(i=0; i<getAllUserResult.length ;i++)
                {
                    user = getAllUserResult[i];
                    if(user.nickname == req.body.nickname)
                    {
                        res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NICKNAME_ALREADY_EXISTS));
                        duplicate = true;
                        break;
                    }
                }
                if(!duplicate)
                {
                    const salt = await crypto.randomBytes(32);
                    const password = await crypto.pbkdf2(req.body.password, salt.toString('base64'), 1000, 32, 'SHA512');
                    const insertUserQuery = 'INSERT INTO user (username, userId, password, salt, nickname) VALUES (?, ?, ?, ?, ?)';
                    const insertUserResult = await db.queryParam_Arr(insertUserQuery,
                        [req.body.name, req.body.id, password.toString('base64'), salt.toString('base64'), req.body.nickname]);
                    if (!insertUserResult) {
                        res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.USER_INSERT_FAIL));
                    } else { 
                        res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.USER_INSERT_SUCCESS));
                    }
                }
            }
        }
    },
    SignIn: async(req, res) => {
        try{
            const getUserWithSameIdQuery = 'SELECT userIdx, userId, username, salt, password, nickname FROM user WHERE userId = ?';
            let resultUser = await db.queryParam_Arr(getUserWithSameIdQuery, [req.body.id] );
            if(resultUser.length == 0)
            {
                res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.ID_MISS_MATCH));
            }
            else{
                const salt = resultUser[0].salt;
                const password = await crypto.pbkdf2(req.body.password, salt, 1000, 32, 'SHA512');
                if(resultUser[0].password == password.toString('base64'))
                {
                    const User = {
                        userIdx: resultUser[0].userIdx,
                        nickname: resultUser[0].nickname
                    }
                    const token = jwt.sign(User).accessToken
                    const responseData = {
                        userIdx: resultUser[0].userIdx,
                        id: resultUser[0].userId,
                        name: resultUser[0].username,
                        nickname: resultUser[0].nickname,
                        token
                    }
                    res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, responseData));
                }
                else{
                    res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.PASSWORD_MISS_MATCH));
                } 
            }
        }
        catch(err){
            console.log(err)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.USER_SELECT_FAIL));
        }
    }
}
