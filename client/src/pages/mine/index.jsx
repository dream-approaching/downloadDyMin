import Taro, {
  useDidShow,
  useShareAppMessage,
  useState,
  useEffect,
  useShareTimeline,
  usePullDownRefresh
} from '@tarojs/taro';
import { View, Text, Button, Image, Video } from '@tarojs/components';
// import dayjs from 'dayjs';
import { AtMessage, AtCard, AtButton } from 'taro-ui';
import './index.less';

export default function Mine() {
  const [userInfo, setUserInfo] = useState(Taro.getStorageSync('userInfo'));
  const setUserInfoFn = async () => {
    const user = await Taro.getUserInfo();
    Taro.setStorage({ key: 'userInfo', data: user });
    console.log('%cuser:', 'color: #0e93e0;background: #aaefe5;', user);
    setUserInfo(user);
  };

  // 获取openId
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    async function getOpenId() {
      const openIdBc = await Taro.getApp().getOpenid();
      return openIdBc;
    }
    getOpenId().then(res => setOpenId(res));
  }, []);

  const [pageLoading, setPageLoading] = useState(true);
  const [downloadList, setdownloadList] = useState([]);

  const initialFn = async () => {
    // Taro.startPullDownRefresh();
    const authSettings = await Taro.getSetting();
    if (authSettings.authSetting['scope.userInfo']) {
      Taro.showNavigationBarLoading();
      Taro.showToast({ title: '努力加载中...', icon: 'loading' });
      await setUserInfoFn();
      await setPageLoading(true);
      try {
        const res = await Taro.cloud.callFunction({
          name: 'getDownloadList',
          data: { openId }
        });
        Taro.hideNavigationBarLoading();
        Taro.hideToast();
        await setPageLoading(false);
        setdownloadList(res.result.reverse());
      } catch (error) {
        await setPageLoading(false);
        Taro.hideNavigationBarLoading();
        Taro.hideToast();
        console.log('error 27', error);
      }
    }
  };
  useDidShow(async () => {
    await initialFn();
  });

  // 下拉刷新
  usePullDownRefresh(async () => {
    wx.stopPullDownRefresh();
    await initialFn();
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

  // useTabItemTap(async () => {
  //   await setUserInfoFn();
  // });

  const handleClickDownload = async url => {
    console.log('%curl:', 'color: #0e93e0;background: #aaefe5;', url);
    await Taro.setStorage({ key: 'urlFromMine', data: url });
    Taro.switchTab({ url: `/pages/index/index` });
  };

  // 授权回调
  const authorityCallback = async data => {
    if (data.detail.userInfo) {
      await initialFn();
    }
  };

  console.log('%cdownloadList:', 'color: #0e93e0;background: #aaefe5;', downloadList);
  return (
    <View className='container'>
      <AtMessage />
      {!userInfo ? (
        <Button onGetUserInfo={authorityCallback} className='loginBtn' openType='getUserInfo'>
          授权即可查看下载历史
        </Button>
      ) : (
        <View>
          {/* <View className='profile-info'>
            <Image className='avatar' src={userInfo.userInfo.avatarUrl}></Image>
            <View className='info'>
              <Text className='name'>{userInfo.userInfo.nickName}</Text>
            </View>
          </View> */}
          <View>
            {!downloadList.length && !pageLoading ? (
              <AtCard title='暂无历史记录'></AtCard>
            ) : (
              downloadList.map(item => {
                return (
                  <AtCard
                    key={item._id}
                    className='itemCon'
                    extra={`热度：${item.downloadTimes}`}
                    // note={item.uploadTime}
                    title={`${item.title.slice(0, 10)}...`}
                  >
                    <View className='itemContent'>
                      <Video
                        src={item.fileId}
                        controls
                        autoplay={false}
                        initialTime='0'
                        loop={false}
                        muted={false}
                        className='cover'
                      />
                      {/* <Image className='cover' mode='aspectFit' src={item.coverArr[0]} /> */}
                      <View className='rightContent'>
                        <View>
                          <Text className='title'>{item.title}</Text>
                          <AtButton onClick={() => handleClickDownload(item.url)} className='btn'>
                            下载
                          </AtButton>
                        </View>
                        <View className='timeCon'>
                          <View className='authorCon'>
                            <Text className='nickname'>{item.author.nickname}</Text>
                            <Image
                              className='avatar'
                              mode='aspectFit'
                              src={item.author.avatar_thumb.url_list[0]}
                            />
                          </View>
                          <Text className='time'>{item.uploadTime}</Text>
                        </View>
                      </View>
                    </View>
                  </AtCard>
                );
              })
            )}
          </View>
        </View>
      )}
    </View>
  );
}

Mine.config = {
  navigationBarTitleText: '下载历史',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark'
};
