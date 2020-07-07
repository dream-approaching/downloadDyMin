// import axios from 'axios';
const axios = require('axios');
const userAgent =
  'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Mobile Safari/537.36';
async function request(url, type) {
  const option = {
    url,
    method: 'get',
    headers: {
      'user-agent': userAgent,
    },
  };
  if (type) {
    option.responseType = type;
  }
  return axios(option);
}

async function runDouyin(shareUrl) {
  // 1.根据分享的视频地址，通过重定向获取整个html信息
  console.log('%cshareUrl:', 'color: #0e93e0;background: #aaefe5;', shareUrl);
  const ress = await request(shareUrl);
  const { request: req } = ress;
  const itemId = req.path.replace(/^\/|\/$/g, '').split('/')[2];
  console.log('%citemId:', 'color: #0e93e0;background: #aaefe5;', itemId);
  const long_url = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${itemId}&dytk=`;
  const { data: videoJson } = await request(long_url);
  console.log('%cvideoJson:', 'color: #0e93e0;background: #aaefe5;', videoJson);

  // 3.最后通过uri参数来调用视频下载接口
  const { author, music } = videoJson.item_list[0];
  const uriId = videoJson.item_list[0].video.play_addr.uri;
  const share_title = videoJson.item_list[0].share_info.share_title;
  const noWatermarkUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${uriId}&line=0&ratio=540p&media_type=4&vr_type=0&improve_bitrate=0&is_play_url=1&is_support_h265=0&source=PackSourceEnum_PUBLISH`;
  const coverArr = videoJson.item_list[0].video.cover.url_list;
  const createTime = videoJson.item_list[0].create_time;

  const res = await request(noWatermarkUrl, 'arraybuffer');
  const size = res.headers['content-length'];
  const { data: videoStream } = res;
  return { videoStream, share_title, size, coverArr, music, author, createTime };
}

module.exports = {
  runDouyin,
};
