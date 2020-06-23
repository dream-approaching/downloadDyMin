/* eslint-disable no-undef */
import Taro, { useState, useRef, useEffect, useDidShow } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import dayjs from 'dayjs';
// eslint-disable-next-line no-unused-vars
import { AtTextarea, AtButton, AtMessage, AtTimeline, AtProgress } from 'taro-ui';
import './index.less';
import MyToast from '../../components/Toast';

const RETRY_TIMES = 3;
export default function Index() {
  // const [value, setValue] = useState(
  //   '这临时反应真的快#一直dou在你身边 @抖音小助手 https://v.douyin.com/JRLkxRy/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState(
  //   '最近天气真好，随手一拍 https://v.douyin.com/JRAvoCB/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState('');
  const [value, setValue] = useState(
    '我不过喜欢一个有Q的男朋友，我漂亮有错吗#李连杰 @DOU+小助手 https://v.douyin.com/JRuvXJn/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  );
  // const [value, setValue] = useState(
  //   '盘点电影十佳动作场面第二名快餐车！#成龙 #经典 #电影 #抖音热门 https://v.douyin.com/JdwUt1V/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [progress, setProgress] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('progress');
  const [downloadTask, setdownloadTask] = useState(null);
  const downloadTaskRef = useRef();

  const handleChange = values => {
    setValue(values);
    // 在小程序中，如果想改变 value 的值，需要 `return value` 从而改变输入框的当前值
    return values;
  };

  let retryTimes = 0;
  const handleDownload = async () => {
    const authSettings = await Taro.getSetting();
    if (authSettings.authSetting['scope.userInfo']) {
      const userInfo = await Taro.getUserInfo();

      setProgressStatus('progress');
      if (downloadTask) {
        return MyToast('正在下载，请稍候...');
      }
      const index1 = value.indexOf('http');
      const index2 = value.indexOf('复制');
      const url = value.slice(index1, index2 - 1);
      console.log('%curl:', 'color: #0e93e0;background: #aaefe5;', url);
      if (url.indexOf('douyin') <= -1 || url.indexOf('http') <= -1) {
        return MyToast('请检查复制的链接是否正确');
      }
      await setAnalyzing(true);
      const failFn = text => {
        setProgressStatus('error');
        Taro.atMessage({
          message: text || '下载失败',
          type: 'error'
        });
        // setProgress(null);
        setAnalyzing(false);
        setdownloadTask(null);
      };
      /**
       * @param fileID 用于下载
       * @param databaseId 用于数据上报
       */
      const downloadFn = async (fileID, databaseId) => {
        const task = wx.cloud.downloadFile({
          fileID,
          success: async res => {
            console.log('%cdownloadFile res:', 'color: #0e93e0;background: #aaefe5;', res);

            console.log('%cdatabaseId:', 'color: #0e93e0;background: #aaefe5;', databaseId);

            retryTimes = 0;
            // 界面逻辑
            setdownloadTask(null);
            if (downloadTaskRef.current) {
              // 如果不存在,表示是手动取消的
              setProgressStatus('success');
              Taro.atMessage({
                message: '下载成功',
                type: 'success'
              });
              // setProgress(null);
            }

            // 调用云函数接口 下载次数加一
            await wx.cloud.callFunction({
              name: 'recordDownload',
              data: { databaseId, userInfo }
            });

            // 调用云函数接口 用户增加下载次数
            await wx.cloud.callFunction({
              name: 'setUsers',
              data: {
                userInfo,
                type: 'download',
                videoId: databaseId
              }
            });

            // 保存到相册
            Taro.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success(res2) {
                console.log(res2.errMsg);
              }
            });
          },
          fail: err => {
            console.log('%cerr114:', 'color: #0e93e0;background: #aaefe5;', err);
            if (err.errMsg.indexOf('parameter.fileID should be string') > -1) {
              console.log('%cretryTimes:', 'color: #0e93e0;background: #aaefe5;', retryTimes);
              if (retryTimes >= RETRY_TIMES) {
                retryTimes = 0;
                return failFn('抱歉，失败次数过多，请检查链接或选择其他视频');
              } else {
                MyToast('解析错误，正为您重试...', 1000);
                setTimeout(async () => {
                  retryTimes += 1;
                  handleDownload();
                }, 100);
              }
            } else {
              setTimeout(() => {
                failFn(err.errMsg);
              }, 100);
            }
          }
        });
        setdownloadTask(task);
        task.onProgressUpdate(async res => {
          setAnalyzing(false);
          setProgress({
            percent: res.progress,
            totalNeed: (res.totalBytesExpectedToWrite / 1024 / 1024).toFixed(2),
            currentDownload: (res.totalBytesWritten / 1024 / 1024).toFixed(2)
          });
        });
      };
      // 检查是否已经上传过
      const checkHasVideo = await wx.cloud.callFunction({
        name: 'checkHasVideo',
        data: { url }
      });
      console.log('%ccheckHasVideo:', 'color: #0e93e0;background: #aaefe5;', checkHasVideo);
      if (checkHasVideo.result.length > 0) {
        const video = checkHasVideo.result[0];
        // 没有fileId表示视频还未上传完成，再次轮询
        if (!video.fileId) {
          const waitFileIdInterval = setInterval(async () => {
            const againCheck = await wx.cloud.callFunction({
              name: 'checkHasVideo',
              data: { url }
            });
            if (againCheck.result[0].fileID) {
              clearInterval(waitFileIdInterval);
              downloadFn(video.fileId, video._id);
            }
          }, 500);
        } else {
          downloadFn(video.fileId, video._id);
        }
      } else {
        wx.cloud.callFunction({
          name: 'uploadVideo',
          data: { url, userInfo },
          success: uploadRes => {
            console.log('res 144', uploadRes); // 3
            if (uploadRes.result.name === 'Error') {
              console.log('uploadRes.result.message', uploadRes.result.message);
              return failFn(uploadRes.result.message);
            }
            downloadFn(uploadRes.result.fileID, uploadRes.result.databaseId);
          },
          fail: err => {
            console.log('err 167', err);
            // 20s超时，但视频会继续上传，2s后重试
            if (err.errMsg.indexOf('timeout') > -1) {
              MyToast('该视频较大，请耐心等候');
              setTimeout(() => {
                handleDownload();
              }, 1000);
            }
            // MyToast(JSON.stringify(err));
          }
        });
      }
    }
  };

  const cancleDownload = () => {
    downloadTask.abort();
    setdownloadTask(null);
    setProgress(null);
  };

  useEffect(() => {
    downloadTaskRef.current = downloadTask;
  }, [downloadTask]);

  useDidShow(async () => {
    const authSettings = await Taro.getSetting();
    if (authSettings.authSetting['scope.userInfo']) {
      const userInfo = await Taro.getUserInfo();
      // 如果已经授权，则更新一下lastLogin
      await wx.cloud.callFunction({
        name: 'setUsers',
        data: { userInfo, updateObj: { lastLogin: dayjs().format('YYYY-MM-DD HH:mm:ss') } }
      });
    }
  });

  console.log('%cprogress:', 'color: #0e93e0;background: #aaefe5;', progress);
  const isDownloading = progress && progress.percent !== 100;
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
      <AtButton
        openType='getUserInfo'
        loading={isDownloading || analyzing}
        onClick={handleDownload}
        className='btn'
        type='primary'
      >
        {analyzing ? '解析中' : `下载${isDownloading ? '中' : ''}`}
      </AtButton>
      {progress && (
        <View className='progressCon'>
          <AtProgress isHidePercent percent={progress.percent} status={progressStatus} />
          <View className='progressInfo'>
            <Text>{progress.currentDownload}M</Text>
            <Text>{progress.totalNeed}M</Text>
          </View>
        </View>
      )}
      {isDownloading && (
        <AtButton onClick={cancleDownload} size='small' className='cancelBtn'>
          取消下载
        </AtButton>
      )}
    </View>
  );
}

Index.config = {
  navigationBarTitleText: '首页'
};
