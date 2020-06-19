const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event) => {
  const res = await cloud.downloadFile({
    fileID: event.fileID, // 文件 ID
  });
  console.log('%cres:', 'color: #0e93e0;background: #aaefe5;', res);
  const buffer = res.fileContent;
  return buffer.toString('utf8');
};
