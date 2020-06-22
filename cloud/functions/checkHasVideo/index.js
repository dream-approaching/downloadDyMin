const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const videos = db.collection('videos');

const _ = db.command;
exports.main = async (event, context) => {
  const filterList = await videos
    .where({
      url: _.eq(event.url),
    })
    .get();
  if (filterList.data.length > 0 && !filterList.data[0].fileId) {
    await videos
      .where({
        url: _.eq(event.url),
      })
      .remove();
    return [];
  }
  return filterList.data;
};
