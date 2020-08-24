/* eslint-disable react/react-in-jsx-scope */
import Taro, {
  useState,
  useRef,
  useEffect,
  useDidShow,
  useShareAppMessage,
  useShareTimeline
} from '@tarojs/taro';
import { View, Text, Button, Image } from '@tarojs/components';
import {
  AtTextarea,
  AtButton,
  AtMessage,
  AtProgress,
  AtModal,
  AtModalContent,
  AtModalAction,
  AtList,
  AtListItem
} from 'taro-ui';
import step1 from '../../assets/step1.jpg';
import step2 from '../../assets/step2.jpg';
import './index.less';
import MyToast from '../../components/Toast';

const RETRY_TIMES = 5;
export default function Index() {
  // const [value, setValue] = useState(
  //   '这临时反应真的快#一直dou在你身边 @抖音小助手 https://v.douyin.com/JRLkxRy/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState(
  //   '最近天气真好，随手一拍 https://v.douyin.com/JRAvoCB/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [value, setValue] = useState('');
  // const [value, setValue] = useState(
  //   '我不过喜欢一个有Q的男朋友，我漂亮有错吗#李连杰 @DOU+小助手 https://v.douyin.com/JRuvXJn/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
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
  let waitFileIdInterval = null;
  const handleDownload = async () => {
    console.log('执行了handleDownload');
    const authSettings = await Taro.getSetting();
    if (authSettings.authSetting['scope.userInfo']) {
      const userInfo = await Taro.getUserInfo();
      Taro.setStorage({ key: 'userInfo', data: userInfo });
      setProgressStatus('progress');
      if (downloadTask) {
        return MyToast('正在下载，请稍候...');
      }
      const reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
      const urlArr = value.trim().match(reg);
      if (!urlArr) {
        return MyToast('请检查复制的链接是否正确');
      }
      const url = urlArr[0];
      console.log('%curl:', 'color: #0e93e0;background: #aaefe5;', url);
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
            console.log(
              '%cdownloadTaskRef:',
              'color: #0e93e0;background: #aaefe5;',
              downloadTaskRef
            );
            // 如果不存在,表示是手动取消的
            if (downloadTaskRef.current) {
              setProgressStatus('success');
              Taro.atMessage({
                message: '下载成功',
                type: 'success'
              });
              // setProgress(null);

              // 调用云函数接口 下载次数加一
              try {
                await wx.cloud.callFunction({
                  name: 'recordDownload',
                  data: { databaseId, userInfo }
                });
              } catch (error) {
                console.log('%cerror124:', 'color: #0e93e0;background: #aaefe5;', error);
              }

              // 调用云函数接口 用户增加下载次数
              try {
                await wx.cloud.callFunction({
                  name: 'setUsers',
                  data: {
                    userInfo,
                    type: 'download',
                    videoId: databaseId
                  }
                });
              } catch (error) {
                console.log('%cerror138:', 'color: #0e93e0;background: #aaefe5;', error);
              }

              // 保存到相册
              Taro.saveVideoToPhotosAlbum({
                filePath: res.tempFilePath,
                success(res2) {
                  console.log(res2.errMsg);
                }
              });
            }
          },
          fail: err => {
            console.log('%cerr116:', 'color: #0e93e0;background: #aaefe5;', err);
            if (err.errMsg.indexOf('parameter.fileID should be string') > -1) {
              console.log('%cretryTimes:', 'color: #0e93e0;background: #aaefe5;', retryTimes);
              if (retryTimes >= RETRY_TIMES) {
                retryTimes = 0;
                return failFn('抱歉，失败次数过多，请检查链接或选择其他视频');
              } else {
                MyToast('解析错误，正为您重试', 1000);
                setTimeout(async () => {
                  retryTimes += 1;
                  handleDownload({});
                }, 100);
              }
            } else if (err.errMsg.indexOf('ERR_CONNECTION_ABORTED') > -1) {
              MyToast('网络错误，正为您重试', 1000);
              handleDownload({});
            } else {
              failFn('下载失败，请重新尝试');
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
        let video = checkHasVideo.result[0];
        console.log('%cvideo:', 'color: #0e93e0;background: #aaefe5;', video);
        // 没有fileId表示视频还未上传完成，再次轮询
        if (!video.fileId) {
          console.log('没有fileId表示视频还未上传完成，再次轮询');
          waitFileIdInterval = setInterval(async () => {
            const againCheck = await wx.cloud.callFunction({
              name: 'checkHasVideo',
              data: { url }
            });
            console.log('%cagainCheck:', 'color: #0e93e0;background: #aaefe5;', againCheck);
            if (againCheck.result[0].fileId) {
              video = againCheck.result[0].fileId;
              clearInterval(waitFileIdInterval);
              downloadFn(video.fileId, video._id);
            }
          }, 1000);
        } else {
          downloadFn(video.fileId, video._id);
        }
      } else {
        console.log('checkHasVideo.result.length <=0', checkHasVideo.result.length <= 0);
        wx.cloud.callFunction({
          name: 'uploadVideo',
          data: { url, userInfo },
          success: uploadRes => {
            console.log('res 144', uploadRes); // 3
            console.log(
              '%cuploadRes.result:',
              'color: #0e93e0;background: #aaefe5;',
              uploadRes.result.name
            );
            if (uploadRes.result.name === 'Error') {
              console.log('uploadRes.result.message', uploadRes.result.message);
              return failFn(uploadRes.result.message);
            }
            if (uploadRes.result.fileID) {
              downloadFn(uploadRes.result.fileID, uploadRes.result.databaseId);
            } else {
              handleDownload({});
            }
          },
          fail: err => {
            console.log('err 167', err);
            // 20s超时，但视频会继续上传，2s后重试
            if (err.errMsg.indexOf('timeout') > -1) {
              MyToast('解析超时，正在重试');
              setTimeout(() => {
                handleDownload({});
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
    setProgressStatus('error');
    Taro.atMessage({
      message: '取消下载',
      type: 'error'
    });
    setAnalyzing(false);
  };

  // 授权回调
  const authorityCallback = async data => {
    if (data.detail.userInfo) {
      handleDownload({});
    }
  };

  useEffect(() => {
    downloadTaskRef.current = downloadTask;
  }, [downloadTask]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      waitFileIdInterval && clearInterval(waitFileIdInterval);
    };
  }, [waitFileIdInterval]);

  const [showCurtain, setShowCurtain] = useState(false);
  const [curtainImg, setCurtainImg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clipboardText, setClipboardText] = useState('');

  useDidShow(async () => {
    console.log('didShow');
    const urlFromMine = Taro.getStorageSync('urlFromMine');
    console.log('%curlFromMine:', 'color: #0e93e0;background: #aaefe5;', urlFromMine);
    if (urlFromMine) {
      Taro.removeStorage({ key: 'urlFromMine' });
      await handleChange(urlFromMine);
      await handleDownload({ urlFromMine });
    }
    // 获取剪切板内容
    try {
      const clipboard = await Taro.getClipboardData();
      if (clipboard.data.indexOf('https://v.douyin.com') > -1) {
        await setClipboardText(clipboard.data);
        setTimeout(() => {
          setModalOpen(true);
        }, 500);
      }
    } catch (error) {
      console.log('error 227', error);
    }
  });

  useShareAppMessage(res => {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target);
    }
    return {
      title: '无水印下载douyin',
      path: 'pages/index/index'
    };
  });

  useShareTimeline(res => {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target);
    }
    return {
      title: '无水印下载douyin'
    };
  });

  const clearClipboard = () =>
    Taro.setClipboardData({
      data: ' ',
      success: wx.hideToast,
      fail: err => console.log('err276', err)
    });

  const isDownloading = progress && progress.percent !== 100 && progressStatus === 'progress';
  const tipArr = [
    { id: 1, title: '打开抖音，选择需要去水印的视频', pic: step1 },
    { id: 2, title: '点击分享按钮，选择复制链接', pic: step2 },
    { id: 3, title: '打开小程序，自动识别链接(若识别失败请手动粘贴)' },
    { id: 4, title: '点击下载' }
  ];
  return (
    <View className='index'>
      <AtMessage />
      <View className='title'>
        <Text>说明</Text>
      </View>
      <AtList hasBorder={false} className='list'>
        {tipArr.map(item => {
          return (
            <AtListItem
              key={item.id}
              onClick={() => {
                if (item.pic) {
                  setShowCurtain(true);
                  setCurtainImg(item.pic);
                }
              }}
              arrow={item.pic && 'right'}
              hasBorder={false}
              className='itemText'
              title={`${item.id}、${item.title}`}
            />
          );
        })}
      </AtList>
      <AtTextarea
        name='value'
        type='text'
        placeholder='粘贴复制的链接'
        value={value}
        onChange={handleChange}
        clear
        // autoFocus
        border
        maxLength={240}
        height={220}
        adjustPosition
        className='input'
      />
      <AtButton
        openType='getUserInfo'
        onGetUserInfo={authorityCallback}
        loading={isDownloading || analyzing}
        // onClick={handleDownload}
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
      {isDownloading && downloadTask && (
        <AtButton onClick={cancleDownload} size='small' className='cancelBtn'>
          取消下载
        </AtButton>
      )}
      <View className='versionInfo'>
        <Text>当前版本：</Text>
        <Text>v1.3.1</Text>
      </View>
      <AtModal isOpened={modalOpen && !showCurtain}>
        <AtModalContent>检测到链接：{clipboardText} 是否填入？</AtModalContent>
        <AtModalAction>
          <Button
            onClick={() => {
              setModalOpen(false);
              clearClipboard();
            }}
          >
            取消
          </Button>
          <Button
            onClick={() => {
              handleChange(clipboardText);
              setModalOpen(false);
              // 设置成功后清除剪切板
              clearClipboard();
            }}
          >
            确定
          </Button>
        </AtModalAction>
      </AtModal>
      <AtModal
        className='imgModal'
        isOpened={showCurtain}
        onClose={async () => {
          await setModalOpen(false);
          await setShowCurtain(false);
          setCurtainImg(null);
        }}
      >
        <Image className='tipImg' mode='aspectFit' src={curtainImg} />
      </AtModal>
    </View>
  );
}

Index.config = {
  navigationBarTitleText: '去水印'
};
