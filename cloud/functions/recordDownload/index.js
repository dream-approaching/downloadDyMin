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
  console.log('%crecordRes:', 'color: #0e93e0;background: #aaefe5;', recordRes);
  const currentUsers = recordRes.data.downloadUsers;
  const userIsInRecord = currentUsers.some((item) => item.openId === userInfo.openId);
  console.log('%cuserIsInRecord:', 'color: #0e93e0;background: #aaefe5;', userIsInRecord);
  const updateObj = {
    downloadTimes: _.inc(1),
  };
  if (!userIsInRecord) {
    updateObj.downloadUsers = [...currentUsers, userInfo];
  }
  const res = await videos.doc(databaseId).update({
    data: updateObj,
  });
  return res;
};
