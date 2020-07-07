const cloud = require('wx-server-sdk');
const dayjs = require('dayjs');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const users = db.collection('users');

exports.main = async (event, context) => {
  let { OPENID } = cloud.getWXContext();
  console.log('%cOPENID:', 'color: #0e93e0;background: #aaefe5;', OPENID);
  // 先查询用户是否存在
  const filterList = await users
    .where({
      openId: OPENID,
    })
    .get();
  console.log('%cfilterList:', 'color: #0e93e0;background: #aaefe5;', filterList);
  if (!filterList.data.length) return [];
  return filterList.data[0].downloadArr;
};
