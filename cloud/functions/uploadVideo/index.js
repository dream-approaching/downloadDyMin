const cloud = require('wx-server-sdk');
const dayjs = require('dayjs');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const videos = db.collection('videos');

const _ = db.command;
exports.main = async (event) => {
  const { runDouyin } = require('./core');
  const { url, userInfo } = event;
  try {
    const { videoStream, share_title, size, coverArr } = await runDouyin(url);
    let { OPENID, UNIONID } = cloud.getWXContext();
    // 先将部分信息写入videos表中，待视频上传完成后更新
    const addRes = await videos.add({
      data: {
        title: share_title,
        url: url,
        size,
        coverArr,
        downloadTimes: 0,
        downloadUsers: [],
        uploadUser: { ...userInfo, openId: OPENID, unionId: UNIONID },
        uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    });
    // 上传视频
    const videoName = `${OPENID}_${dayjs().format('YYYYMMDDHHmmss')}`;
    const res = await cloud.uploadFile({
      cloudPath: `${videoName}.mp4`,
      fileContent: videoStream,
    });
    // 更新记录
    await videos.doc(addRes._id).update({
      data: {
        fileId: res.fileID,
        storageName: videoName,
      },
    });
    // 调用云函数 更新用户信息
    await cloud.callFunction({
      name: 'setUsers',
      data: {
        userInfo,
        type: 'upload',
        videoId: addRes._id,
      },
    });
    console.log('%cres2:', 'color: #0e93e0;background: #aaefe5;', res);
    console.log('%caddRes2:', 'color: #0e93e0;background: #aaefe5;', addRes);
    return { ...res, databaseId: addRes._id };
  } catch (error) {
    console.log('%cerror:', 'color: #0e93e0;background: #aaefe5;', error);
    return error;
  }
};
