const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  const express = require('express');
  const { runDouyin } = require('./core');
  const app = express();
  const port = 3000;

  app.get('/api/dy', async (req, res) => {
    if (req.query.url) {
      try {
        const { videoStream, share_title, size } = await runDouyin(req.query.url);
        console.log('%csize:', 'color: #0e93e0;background: #aaefe5;', size);
        res.append('Content-length', size);
        res.append('Warning', '199 Miscellaneous warning');
        res.attachment(`${share_title}(无水印).mp4`);
        console.log('res.', res.header);
        videoStream.pipe(res);
      } catch (e) {
        console.log(e);
        res.send('错误: ' + e);
      }
    } else {
      res.send('url错误');
    }
  });

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};
