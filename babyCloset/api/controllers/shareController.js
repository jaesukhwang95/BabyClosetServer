const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const shareAccessObject = require('../dataAccessObjects/shareAccessObject');
const moment = require('moment');

const ratingFilter =  (rating) => {
    const floor = (rating-Math.floor(rating));
    if(0 <= floor && floor < 0.5)
    {
        floor-0.25 < 0 ? rating = rating-floor : rating = Math.floor(rating)+0.5;
    }
    else
    {
        floor-0.75 >= 0 ? rating = rating - floor + 1 : rating = Math.floor(rating)+0.5;
    }
    return rating;
}

module.exports = {
    PostShare : async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const postIdx = req.body.postIdx;
        console.log(userIdx)
        if(!postIdx)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const postShareResult = shareAccessObject.PostShare(postIdx, userIdx);
            if (!postShareResult)
            {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('나눔')));
            }
            else
            {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('나눔')));
            }
        }
    },
    GetUncompleted: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getUncompletedResult = await shareAccessObject.GetUncompletedShare(userIdx);
        if (!getUncompletedResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredPost = getUncompletedResult.map(post => {
                post.registerNumber = post.registerNumber+'명';
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    },
    GetApplicant: async(req, res) => {
        const postIdx = req.params.postIdx;
        const getPostResult = await shareAccessObject.GetDetailUncompletedShare(postIdx);
        const getApplicantResult = await shareAccessObject.GetApplicantInformation(postIdx);

        if(!getPostResult || !getApplicantResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('신청자')));
        }
        else
        {
            const filteredPostResult = getPostResult.map(e => {
                e.applicantNumber = e.applicantNumber+"명";
                return e;
            })
            const filteredApplicantResult = getApplicantResult.map(e => {
                e.rating = ratingFilter(e.rating);
                return e;
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('신청자'), {
                post: filteredPostResult[0],
                applicants: filteredApplicantResult
            }));
        }
    },
    GetCompleted: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getCompletedResult = await shareAccessObject.GetCompletedShare(userIdx);
        if (!getCompletedResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredPost = getCompletedResult.map(post => {
                post.sharedDate = moment(post.sharedDate).format('YYYY. MM. DD');
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    },
    GetReceived: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getReceivedResult = await shareAccessObject.GetReceivedShare(userIdx);
        if (!getReceivedResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredPost = getReceivedResult.map(post => {
                post.sharedDate = moment(post.sharedDate).format('YYYY. MM. DD');
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    }
}