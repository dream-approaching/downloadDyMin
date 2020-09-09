const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const users = db.collection('users');

exports.main = async (event, context) => {
  let { OPENID, UNIONID } = await cloud.getWXContext();
  console.log('%cOPENID, UNIONID:', 'color: #0e93e0;background: #aaefe5;', OPENID, UNIONID);
  // 先查询用户是否存在
  const filterList = await users
    .where({
      openId: OPENID,
    })
    .get();

  const record = filterList.data[0];
  return record;
};
