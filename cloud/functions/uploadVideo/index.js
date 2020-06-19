const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const videos = db.collection('videos');

exports.main = async (event) => {
  const { runDouyin } = require('./core');
  try {
    const { videoStream, share_title, size } = await runDouyin(event.url);
    let { OPENID, UNIONID } = cloud.getWXContext();
    // 先将部分信息写入videos表中，待视频上传完成后更新
    const addRes = await videos.add({
      data: {
        title: share_title,
        url: event.url,
        downloadTimes: 0,
        uploadUser: { ...event.userInfo, openId: OPENID, unionId: UNIONID },
      },
    });
    // 上传视频
    const res = await cloud.uploadFile({
      cloudPath: `${new Date().getTime()}.mp4`,
      fileContent: videoStream,
    });
    // 更新记录
    await videos.doc(addRes._id).update({
      data: {
        fileId: res.fileID,
      },
    });
    console.log('%cres2:', 'color: #0e93e0;background: #aaefe5;', res);
    console.log('%caddRes2:', 'color: #0e93e0;background: #aaefe5;', addRes);
    return res;
  } catch (error) {
    console.log('%cerror:', 'color: #0e93e0;background: #aaefe5;', error);
    return error;
  }
};
