const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event) => {
  const { runDouyin } = require('./core');

  const { videoStream, share_title, size } = await runDouyin(event.url);
  console.log('%cvideoStream:', 'color: #0e93e0;background: #aaefe5;', videoStream);
  console.log('%csize:', 'color: #0e93e0;background: #aaefe5;', size);
  return await cloud.uploadFile({
    cloudPath: `${share_title}(无水印).mp4`,
    fileContent: videoStream,
  });
};
