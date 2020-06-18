/* eslint-disable no-undef */
import Taro, { useState, useRef, useEffect } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
// eslint-disable-next-line no-unused-vars
import { AtTextarea, AtButton, AtMessage, AtTimeline, AtProgress } from 'taro-ui';
import './index.less';

export default function Index() {
  // const [value, setValue] = useState(
  //   '这临时反应真的快#一直dou在你身边 @抖音小助手 https://v.douyin.com/JRLkxRy/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [value, setValue] = useState(
    '最近天气真好，随手一拍 https://v.douyin.com/JRAvoCB/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  );
  // const [value, setValue] = useState(
  //   '盘点电影十佳动作场面第二名快餐车！#成龙 #经典 #电影 #抖音热门 https://v.douyin.com/JdwUt1V/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [progress, setProgress] = useState(null);
  const [progressStatus, setProgressStatus] = useState('progress');
  const [downloadTask, setdownloadTask] = useState(null);
  const intervalRef = useRef();

  const handleChange = values => {
    setValue(values);
    // 在小程序中，如果想改变 value 的值，需要 `return value` 从而改变输入框的当前值
    return values;
  };

  const handleDownload = async () => {
    setProgressStatus('progress');
    if (downloadTask) {
      return Taro.showToast({
        title: '正在下载，请稍候...',
        icon: 'none',
        duration: 1000
      });
    }
    const index1 = value.indexOf('http');
    const index2 = value.indexOf('复制');
    const url = value.slice(index1, index2 - 1);
    if (url.length < 5) {
      return console.log('请检查复制的链接是否正确');
    }
    const failFn = text => {
      setProgressStatus('error');
      Taro.atMessage({
        message: text || '下载失败',
        type: 'error'
      });
      setProgress(null);
    };
    const task = wx.downloadFile({
      url: `http://zhengjinshou.cn:8002/api/dy?url=${url}`,
      success: res => {
        const lastArr = arr => arr[arr.length - 1];
        if (lastArr(res.tempFilePath.split('.')).toLowerCase() !== 'mp4') {
          failFn('解析错误，请重新尝试');
        } else {
          // 如果不存在,表示是手动取消的
          if (intervalRef.current) {
            setProgressStatus('success');
            Taro.atMessage({
              message: '下载成功',
              type: 'success'
            });
            setProgress(null);
            Taro.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success(res2) {
                console.log(res2.errMsg);
              }
            });
          }
        }
      },
      fail: err => {
        console.log('err', err);
        failFn();
      }
    });

    setdownloadTask(task);

    task.onProgressUpdate(res => {
      setProgress({
        percent: res.progress,
        totalNeed: (res.totalBytesExpectedToWrite / 1024 / 1024).toFixed(2),
        currentDownload: (res.totalBytesWritten / 1024 / 1024).toFixed(2)
      });
    });
  };

  const cancleDownload = () => {
    downloadTask.abort();
    setdownloadTask(null);
    setProgress(null);
  };

  useEffect(() => {
    intervalRef.current = downloadTask;
  }, [downloadTask]);

  console.log('progress', progress);
  const isDownloading = progress && progress !== 100;
  return (
    <View className='index'>
      <AtMessage />
      <Text className='title'>说明</Text>
      <AtTimeline
        className='list'
        items={[
          { title: '点击抖音分享按钮，点击复制链接' },
          { title: '粘贴到文本框' },
          { title: '点击下载' }
        ]}
      ></AtTimeline>
      <AtTextarea
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
      <AtButton loading={isDownloading} onClick={handleDownload} className='btn' type='primary'>
        下载{isDownloading ? '中' : ''}
      </AtButton>
      {progress && (
        <View>
          <View className='progressCon'>
            <AtProgress isHidePercent percent={progress.percent} status={progressStatus} />
            <View className='progressInfo'>
              <Text>{progress.currentDownload}M</Text>
              <Text>{progress.totalNeed}M</Text>
            </View>
          </View>
          <AtButton onClick={cancleDownload} size='small' className='cancelBtn'>
            取消下载
          </AtButton>
        </View>
      )}
    </View>
  );
}

Index.config = {
  navigationBarTitleText: '首页'
};
