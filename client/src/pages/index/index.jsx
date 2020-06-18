/* eslint-disable no-undef */
import Taro, { useState } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
// eslint-disable-next-line no-unused-vars
import { AtInput, AtButton, AtMessage, AtTimeline } from 'taro-ui';
import './index.less';

export default function Index() {
  // const [value, setValue] = useState(
  //   '这临时反应真的快#一直dou在你身边 @抖音小助手 https://v.douyin.com/JRLkxRy/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState(
  //   '最近天气真好，随手一拍 https://v.douyin.com/JRAvoCB/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [value, setValue] = useState(
    '盘点电影十佳动作场面第二名快餐车！#成龙 #经典 #电影 #抖音热门 https://v.douyin.com/JdwUt1V/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  );

  const handleChange = values => {
    setValue(values);
    // 在小程序中，如果想改变 value 的值，需要 `return value` 从而改变输入框的当前值
    return values;
  };

  const handleDownload = async () => {
    const index1 = value.indexOf('http');
    const index2 = value.indexOf('复制');
    const url = value.slice(index1, index2 - 1);
    if (url.length < 5) {
      return console.log('请检查复制的链接是否正确');
    }
    const downloadTask = wx.downloadFile({
      url: `http://zhengjinshou.cn:8002/api/dy?url=${url}`,
      success: res => {
        // Taro.atMessage({
        //   message: '保存成功',
        //   type: 'success'
        // });
        console.log('res', res);
        Taro.saveVideoToPhotosAlbum({
          filePath: res.tempFilePath,
          success(res2) {
            console.log(res2.errMsg);
          }
        });
      },
      fail: err => {
        console.log('err', err);
        // Taro.atMessage({
        //   message: '下载失败',
        //   type: 'error'
        // });
      }
    });

    console.log('%cdownloadTask:', 'color: #0e93e0;background: #aaefe5;', downloadTask);
    downloadTask.onProgressUpdate(res => {
      console.log('%cres:', 'color: #0e93e0;background: #aaefe5;', res);
      console.log('下载进度', res.progress);
      console.log('已经下载的数据长度', res.totalBytesWritten);
      console.log('预期需要下载的数据总长度', res.totalBytesExpectedToWrite);
    });
  };

  return (
    <View className='index'>
      <Text className='title'>说明</Text>
      <AtTimeline
        className='list'
        items={[
          { title: '点击抖音分享按钮，点击复制链接' },
          { title: '粘贴到文本框' },
          { title: '点击下载' }
        ]}
      ></AtTimeline>
      <AtInput
        name='value'
        type='text'
        placeholder='粘贴复制的链接'
        value={value}
        onChange={handleChange}
        clear
        autoFocus
        border
        adjustPosition
        className='input'
      />
      <AtButton onClick={handleDownload} className='btn' type='primary'>
        下载
      </AtButton>
    </View>
  );
}

Index.config = {
  navigationBarTitleText: '首页'
};
