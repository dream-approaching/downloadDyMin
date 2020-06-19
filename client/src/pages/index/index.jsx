/* eslint-disable no-undef */
import Taro, { useState, useRef, useEffect } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
// eslint-disable-next-line no-unused-vars
import { AtTextarea, AtButton, AtMessage, AtTimeline, AtProgress } from 'taro-ui';
import './index.less';
import MyToast from '../../components/Toast';

export default function Index() {
  // const [value, setValue] = useState(
  //   '这临时反应真的快#一直dou在你身边 @抖音小助手 https://v.douyin.com/JRLkxRy/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState(
  //   '最近天气真好，随手一拍 https://v.douyin.com/JRAvoCB/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState('');
  const [value, setValue] = useState(
    '盘点电影十佳动作场面第二名快餐车！#成龙 #经典 #电影 #抖音热门 https://v.douyin.com/JdwUt1V/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  );
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
      return MyToast('正在下载，请稍候...');
    }
    const index1 = value.indexOf('http');
    const index2 = value.indexOf('复制');
    const url = value.slice(index1, index2 - 1);
    if (url.length < 5) {
      return MyToast('请检查复制的链接是否正确');
    }
    const failFn = text => {
      setProgressStatus('error');
      Taro.atMessage({
        message: text || '下载失败',
        type: 'error'
      });
      setProgress(null);
      setdownloadTask(null);
    };
    wx.cloud.callFunction({
      // 云函数名称
      name: 'uploadVideo',
      // 传给云函数的参数
      data: { url },
      success: uploadRes => {
        console.log('res', uploadRes); // 3
        wx.cloud.downloadFile({
          fileID: uploadRes.result.fileID,
          success: res => {
            console.log('%cdownloadFile res:', 'color: #0e93e0;background: #aaefe5;', res);
            Taro.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success(res2) {
                console.log(res2.errMsg);
              }
            });
          },
          fail: err => {
            console.log('%cerr:', 'color: #0e93e0;background: #aaefe5;', err);
            // handle error
          }
        });
        // wx.cloud.callFunction({
        //   name: 'downloadVideo',
        //   data: { fileID: uploadRes.result.fileID },
        //   success: downloadRes => {
        //     console.log('downloadRes', downloadRes);
        //     Taro.saveVideoToPhotosAlbum({
        //       fileContent: downloadRes.result,
        //       success(res2) {
        //         console.log(res2.errMsg);
        //       }
        //     });
        //   }
        // });
      },
      fail: err => {
        MyToast(JSON.stringify(err));
      }
    });
    // const task = wx.downloadFile({
    //   // url: `/api/dy?url=${url}`,
    //   url: `https://zhengjinshou.cn/api/dy?url=${url}`,
    //   success: res => {
    //     const lastArr = arr => arr[arr.length - 1];
    //     if (lastArr(res.tempFilePath.split('.')).toLowerCase() !== 'mp4') {
    //       failFn('解析错误，请重新尝试');
    //     } else {
    //       setdownloadTask(null);
    //       // 如果不存在,表示是手动取消的
    //       if (intervalRef.current) {
    //         setProgressStatus('success');
    //         Taro.atMessage({
    //           message: '下载成功',
    //           type: 'success'
    //         });
    //         setProgress(null);
    //         Taro.saveVideoToPhotosAlbum({
    //           filePath: res.tempFilePath,
    //           success(res2) {
    //             console.log(res2.errMsg);
    //           }
    //         });
    //       }
    //     }
    //   },
    //   fail: err => {
    //     // Taro.showToast({
    //     //   title: JSON.stringify(err),
    //     //   icon: 'none',
    //     //   duration: 1000
    //     // });
    //     console.log('err', err);
    //     setTimeout(() => {
    //       failFn(err.errMsg);
    //     }, 100);
    //   }
    // });

    // setdownloadTask(task);

    // task.onProgressUpdate(res => {
    //   setProgress({
    //     percent: res.progress,
    //     totalNeed: (res.totalBytesExpectedToWrite / 1024 / 1024).toFixed(2),
    //     currentDownload: (res.totalBytesWritten / 1024 / 1024).toFixed(2)
    //   });
    // });
  };

  const cancleDownload = () => {
    downloadTask.abort();
    setdownloadTask(null);
    setProgress(null);
  };

  useEffect(() => {
    intervalRef.current = downloadTask;
  }, [downloadTask]);

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
