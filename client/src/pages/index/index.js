import Taro, {
  useDidShow,
  useShareAppMessage,
  useShareTimeline
} from "@tarojs/taro";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Button, Image, Ad } from "@tarojs/components";
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
} from "taro-ui";
import { likeImgInCloud, version } from "../../config";
import step1 from "../../assets/step1.jpg";
import step2 from "../../assets/step2.jpg";
import "./index.less";
import MyToast from "../../components/Toast";

const RETRY_TIMES = 5;

export default function Index() {
  // const [value, setValue] = useState(
  //   '这临时反应真的快#一直dou在你身边 @抖音小助手 https://v.douyin.com/JRLkxRy/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState(
  //   '最近天气真好，随手一拍 https://v.douyin.com/JRAvoCB/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [value, setValue] = useState("");
  // const [value, setValue] = useState(
  //   '我不过喜欢一个有Q的男朋友，我漂亮有错吗#李连杰 @DOU+小助手 https://v.douyin.com/JRuvXJn/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  // const [value, setValue] = useState(
  //   '盘点电影十佳动作场面第二名快餐车！#成龙 #经典 #电影 #抖音热门 https://v.douyin.com/JdwUt1V/ 复制此链接，打开【抖音短视频】，直接观看视频！'
  // );
  const [leftTimes, setLeftTimes] = useState(10);
  const [downloadTimes, setDownloadTimes] = useState(0);
  const [progress, setProgress] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("progress");
  const [downloadTask, setdownloadTask] = useState(null);
  const downloadTaskRef = useRef();
  const handleChange = async values => {
    await setValue(values);
    // 在小程序中，如果想改变 value 的值，需要 `return value` 从而改变输入框的当前值
    return values;
  };

  // 获取openId
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    async function getOpenId() {
      const openIdBc = await Taro.getApp().$app.getOpenid();
      return openIdBc;
    }
    getOpenId().then(res => setOpenId(res));
  }, []);

  const [rewardedVideoAd, setRewardedVideoAd] = useState(null);
  useEffect(() => {
    if (wx.createRewardedVideoAd) {
      const adArr = [
        "adunit-e7374b8042ca7d75",
        "adunit-4e6f0e852953693f",
        "adunit-a744bbb5daea97b0"
      ];
      const random = parseInt(Math.random() * 3, 10); // 0-2随机数
      let videoAd = wx.createRewardedVideoAd({ adUnitId: adArr[random] });
      videoAd.onLoad(() => {
        console.log("onLoad event emit");
      });
      videoAd.onError(err => {
        console.log("onError event emit", err);
      });
      videoAd.onClose(async ({ isEnded }) => {
        if (isEnded) {
          setShowLike(false);
          handleDownload({ afterAd: true });
        } else {
          Taro.atMessage({
            message: "视频未播放完毕，无法进行下载",
            type: "warning"
          });
        }
      });
      setRewardedVideoAd(videoAd);
    }
  }, []);

  // 显示激励广告
  const showAd = () => {
    if (rewardedVideoAd) {
      Taro.setStorage({ key: "storageValue", data: value });
      rewardedVideoAd.show().catch(() => {
        // 失败重试
        rewardedVideoAd
          .load()
          .then(() => rewardedVideoAd.show())
          .catch(err => {
            Taro.atMessage({
              message: "激励视频 广告显示失败",
              type: "error"
            });
          });
      });
    }
  };

  let retryTimes = 0;
  let waitFileIdInterval = null;
  const handleDownload = async ({ urlFromMine, afterAd }) => {
    console.log("执行了handleDownload");
    setProgressStatus("progress");
    const userInfo = Taro.getStorageSync("userInfo");
    if (downloadTask) {
      return MyToast("正在下载，请稍候...");
    }
    const reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
    const checkValue = afterAd ? Taro.getStorageSync("storageValue") : value;
    const urlArr = urlFromMine ? [urlFromMine] : checkValue.trim().match(reg);
    console.log("%czjs urlArr:", "color: #cc93e0;background: #bbefe5;", urlArr);
    if (!urlArr) {
      return MyToast("请检查复制的链接是否正确");
    }
    Taro.setStorage({ key: "storageValue", data: "" });

    if (leftTimes <= 0 && !afterAd) {
      return setShowLike(true);
    }
    const url = urlArr[0];
    console.log("%curl:", "color: #0e93e0;background: #aaefe5;", url);
    await setAnalyzing(true);
    const failFn = text => {
      setProgressStatus("error");
      Taro.atMessage({
        message: text || "下载失败",
        type: "error"
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
          console.log(
            "%cdownloadFile res:",
            "color: #0e93e0;background: #aaefe5;",
            res
          );
          console.log(
            "%cdatabaseId:",
            "color: #0e93e0;background: #aaefe5;",
            databaseId
          );
          retryTimes = 0;
          // 界面逻辑
          setdownloadTask(null);

          // 3s 后隐藏进度条
          setTimeout(() => setProgress(null), 3000);
          console.log(
            "%cdownloadTaskRef:",
            "color: #0e93e0;background: #aaefe5;",
            downloadTaskRef
          );
          // 如果不存在,表示是手动取消的
          if (downloadTaskRef.current) {
            setProgressStatus("success");
            Taro.atMessage({
              message: "下载成功",
              type: "success"
            });
            // setProgress(null);

            // 调用云函数接口 下载次数加一
            try {
              await wx.cloud.callFunction({
                name: "recordDownload",
                data: { databaseId, userInfo: { ...userInfo, openId } }
              });
            } catch (error) {
              console.log(
                "%cerror124:",
                "color: #0e93e0;background: #aaefe5;",
                error
              );
            }
            const data = {
              userInfo: { ...userInfo, openId },
              type: "download",
              videoId: databaseId
            };
            console.log(
              "%c zjs data:",
              "color: #0e93e0;background: #aaefe5;",
              JSON.stringify(data)
            );
            // 调用云函数接口 用户增加下载次数
            try {
              await wx.cloud.callFunction({
                name: "setUsers",
                data
              });
            } catch (error) {
              console.log(
                "%cerror138:",
                "color: #0e93e0;background: #aaefe5;",
                error
              );
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
          console.log("%cerr116:", "color: #0e93e0;background: #aaefe5;", err);
          if (err.errMsg.indexOf("parameter.fileID should be string") > -1) {
            console.log(
              "%cretryTimes:",
              "color: #0e93e0;background: #aaefe5;",
              retryTimes
            );
            if (retryTimes >= RETRY_TIMES) {
              retryTimes = 0;
              return failFn("抱歉，失败次数过多，请检查链接或选择其他视频");
            } else {
              MyToast("解析错误，正为您重试", 1000);
              setTimeout(async () => {
                retryTimes += 1;
                handleDownload({});
              }, 100);
            }
          } else if (err.errMsg.indexOf("ERR_CONNECTION_ABORTED") > -1) {
            MyToast("网络错误，正为您重试", 1000);
            handleDownload({});
          } else {
            failFn("下载失败，请重新尝试");
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
      name: "checkHasVideo",
      data: { url, openId }
    });
    console.log(
      "%ccheckHasVideo:",
      "color: #0e93e0;background: #aaefe5;",
      checkHasVideo
    );
    if (checkHasVideo.result.length > 0) {
      let video = checkHasVideo.result[0];
      console.log("%cvideo:", "color: #0e93e0;background: #aaefe5;", video);
      // 没有fileId表示视频还未上传完成，再次轮询
      if (!video.fileId) {
        console.log("没有fileId表示视频还未上传完成，再次轮询");
        waitFileIdInterval = setInterval(async () => {
          const againCheck = await wx.cloud.callFunction({
            name: "checkHasVideo",
            data: { url, openId }
          });
          console.log(
            "%cagainCheck:",
            "color: #0e93e0;background: #aaefe5;",
            againCheck
          );
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
      console.log(
        "checkHasVideo.result.length <=0",
        checkHasVideo.result.length <= 0
      );
      wx.cloud.callFunction({
        name: "uploadVideo",
        data: { url, userInfo: { ...userInfo, openId } },
        success: uploadRes => {
          console.log("res 144", uploadRes); // 3
          console.log(
            "%cuploadRes.result:",
            "color: #0e93e0;background: #aaefe5;",
            uploadRes.result.name
          );
          if (uploadRes.result.name === "Error") {
            console.log("uploadRes.result.message", uploadRes.result.message);
            return failFn(uploadRes.result.message);
          }
          if (uploadRes.result.fileID) {
            downloadFn(uploadRes.result.fileID, uploadRes.result.databaseId);
          } else {
            handleDownload({});
          }
        },
        fail: err => {
          console.log("err 167", err);
          // 20s超时，但视频会继续上传，2s后重试
          if (err.errMsg.indexOf("timeout") > -1) {
            MyToast("解析超时，正在重试");
            setTimeout(() => {
              handleDownload({});
            }, 1000);
          }
          // MyToast(JSON.stringify(err));
        }
      });
    }
  };

  const cancleDownload = () => {
    downloadTask.abort();
    setdownloadTask(null);
    setProgress(null);
    setProgressStatus("error");
    Taro.atMessage({
      message: "取消下载",
      type: "error"
    });
    setAnalyzing(false);
  };

  // 授权回调
  const authorityCallback = async () => {
    const { getUserInfo } = Taro.getApp().$app;
    getUserInfo(() => {
      handleDownload({});
    });
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

  const [showLike, setShowLike] = useState(false);
  const [showCurtain, setShowCurtain] = useState(false);
  const [curtainImg, setCurtainImg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clipboardText, setClipboardText] = useState("");

  useDidShow(async () => {
    console.log("didShow");
    const urlFromMine = Taro.getStorageSync("urlFromMine");
    console.log(
      "%curlFromMine:",
      "color: #0e93e0;background: #aaefe5;",
      urlFromMine
    );
    if (urlFromMine) {
      Taro.removeStorage({ key: "urlFromMine" });
      await handleChange(urlFromMine);
      await handleDownload({ urlFromMine });
    }
    // 获取剪切板内容
    try {
      const clipboard = await Taro.getClipboardData();
      if (clipboard.data.indexOf("https://v.douyin.com") > -1) {
        await setClipboardText(clipboard.data);
        setTimeout(() => {
          setModalOpen(true);
        }, 500);
      }
    } catch (error) {
      console.log("error 227", error);
    }

    // 查看是否还有下载次数
    try {
      const myUserData = await wx.cloud.callFunction({
        name: "getUsers",
        data: { openId }
      });
      setLeftTimes(myUserData.result.left);
      console.log(
        "%c zjs myUserData.result.left:",
        "color: #0e93e0;background: #aaefe5;",
        myUserData.result.left
      );
      setDownloadTimes(myUserData.result.downloadTimes);
    } catch (error) {
      console.log(
        "%cmyUserData error:",
        "color: #0e93e0;background: #aaefe5;",
        error
      );
    }
  });

  useShareAppMessage(res => {
    if (res.from === "button") {
      // 来自页面内转发按钮
      console.log(res.target);
    }
    return {
      title: "无水印下载douyin",
      path: "pages/index/index"
    };
  });

  useShareTimeline(res => {
    if (res.from === "button") {
      // 来自页面内转发按钮
      console.log(res.target);
    }
    return {
      title: "无水印下载douyin"
    };
  });

  const clearClipboard = () =>
    Taro.setClipboardData({
      data: " ",
      success: wx.hideToast,
      fail: err => console.log("err355", err)
    });

  const isDownloading =
    progress && progress.percent !== 100 && progressStatus === "progress";
  const tipArr = [
    { id: 1, title: "打开抖音，选择需要去水印的视频", pic: step1 },
    { id: 2, title: "点击分享按钮，选择复制链接", pic: step2 },
    { id: 3, title: "打开小程序，自动识别链接(若识别失败请手动粘贴)" },
    { id: 4, title: "点击下载" }
  ];

  return (
    <View className="index">
      <AtMessage />
      <AtList hasBorder={false} className="list">
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
              arrow={item.pic && "right"}
              hasBorder={false}
              className="itemText"
              title={`${item.id}、${item.title}`}
            />
          );
        })}
      </AtList>

      <AtTextarea
        name="value"
        type="text"
        placeholder="粘贴复制的链接"
        value={value}
        onChange={handleChange}
        clear
        // autoFocus
        border
        maxLength={240}
        height={200}
        adjustPosition
        className="input"
      />
      <AtButton
        // openType="getUserInfo"
        // onGetUserInfo={authorityCallback}
        loading={isDownloading || analyzing}
        onClick={authorityCallback}
        className="btn"
        type="primary"
      >
        {analyzing ? "解析中" : `下载${isDownloading ? "中" : ""}`}
      </AtButton>
      {progress && (
        <View className="progressCon">
          <AtProgress
            isHidePercent
            percent={progress.percent}
            status={progressStatus}
          />
          <View className="progressInfo">
            <Text>{progress.currentDownload}M</Text>
            <Text>{progress.totalNeed}M</Text>
          </View>
        </View>
      )}
      {isDownloading && downloadTask && (
        <AtButton onClick={cancleDownload} size="small" className="cancelBtn">
          取消下载
        </AtButton>
      )}
      <View className="versionInfo">
        {/* <AtButton onClick={() => wx.previewImage({ urls: [likeImgInCloud] })} size='small' className='likeBtn'>
          赞赏
        </AtButton> */}
        <View class="bannerAdContainer">
          <Ad unitId="adunit-5e2c86dc9b0847b8" adIntervals="30"></Ad>
        </View>
        <View className="flexCon">
          <Text>版本： v{version}</Text>
          <Button open-type="contact" size="small" className="serviceBtn">
            联系客服
          </Button>
          <Text>已使用{downloadTimes}次</Text>
        </View>
      </View>
      <AtModal
        onClose={async () => {
          await setModalOpen(false);
        }}
        isOpened={modalOpen}
      >
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
        className="imgModal"
        isOpened={showCurtain && !showLike}
        onClose={async () => {
          await setShowCurtain(false);
          setCurtainImg(null);
        }}
      >
        <Image className="tipImg" mode="aspectFit" src={curtainImg} />
      </AtModal>
      <AtModal
        onClose={async () => {
          await setShowLike(false);
        }}
        className="likeModal"
        isOpened={showLike}
        // isOpened
        cancelText="取消"
        confirmText="确认"
      >
        {leftTimes <= 0 && (
          <View className="likeTextCon">
            <Text className="title">
              温馨提示，您的使用次数已用完，观看广告后方可免费下载，或添加客服微信购买次数
            </Text>

            <Text className="tip">
              注：采取每人免费10次使用次数，超过之后0.2/元
            </Text>
            <AtModalAction>
              <AtButton onClick={showAd} size="small" className="likeBtn">
                看广告
              </AtButton>
              <AtButton
                onClick={() => wx.previewImage({ urls: [likeImgInCloud] })}
                size="small"
                className="likeBtn"
              >
                加客服
              </AtButton>
            </AtModalAction>
          </View>
        )}
      </AtModal>
    </View>
  );
}
