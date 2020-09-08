const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const videos = db.collection('videos');

const _ = db.command;
exports.main = async (event, context) => {
  const { databaseId, userInfo } = event;
  const recordRes = await videos.doc(databaseId).get();
  let { OPENID } = await cloud.getWXContext();
  const currentUsers = recordRes.data.downloadUsers;
  const userIsInRecord = currentUsers.some((item) => item.openId === OPENID);
  const updateObj = {
    downloadTimes: _.inc(1),
  };
  if (!userIsInRecord) {
    updateObj.downloadUsers = [...currentUsers, { ...userInfo, openId: OPENID }];
  }
  const res = await videos.doc(databaseId).update({
    data: updateObj,
  });
  return res;
};
