const db = require('../../modules/utils/db/pool');

module.exports = {
    PostShare :  async (postIdx, userIdx)  => {
        const postShareQuery = `INSERT INTO sharingWant (postIdx, receiverIdx) VALUES (?, ?)`;
        const updateCountQuery = 'UPDATE post SET registerNumber = registerNumber+1 where postIdx = ?'
        const postTransaction = await db.Transaction(async(connection) => {
            await connection.query(postShareQuery, [postIdx, userIdx]);
            await connection.query(updateCountQuery, [postIdx]);
        })
        return postTransaction;
    },
    GetUncompletedShare : async(userIdx) => {
        const selectPostQuery = 
        `SELECT selectedPost.postIdx, selectedPost.postTitle, selectedPost.mainImage, area.areaName, selectedPost.registerNumber FROM
        (SELECT postIdx, postTitle, mainImage, registerNumber FROM post WHERE isShared = 0 AND userIdx = ?) AS selectedPost,
        (SELECT postAreaCategory.postIdx, areaCategory.areaName
        FROM areaCategory, postAreaCategory WHERE areaCategory.areaCategoryIdx = postAreaCategory.areaCategoryIdx) AS area
        WHERE selectedPost.postIdx = area.postIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    },
}