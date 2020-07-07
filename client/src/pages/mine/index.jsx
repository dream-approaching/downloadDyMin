import Taro, { useDidShow, useShareAppMessage, useState } from '@tarojs/taro';
import { View, Text, Button, Image } from '@tarojs/components';
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

  const [pageLoading, setPageLoading] = useState(true);
  const [downloadList, setdownloadList] = useState([]);

  const initialFn = async () => {
    // Taro.startPullDownRefresh();
    const authSettings = await Taro.getSetting();
    if (authSettings.authSetting['scope.userInfo']) {
      Taro.showNavigationBarLoading();
      await setUserInfoFn();
      await setPageLoading(true);
      try {
        const res = await Taro.cloud.callFunction({
          name: 'getDownloadList'
        });
        Taro.hideNavigationBarLoading();
        await setPageLoading(false);
        setdownloadList(res.result.reverse());
      } catch (error) {
        await setPageLoading(false);
        Taro.hideNavigationBarLoading();
        console.log('error 27', error);
      }
    }
  };
  useDidShow(async () => {
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
                      <Image className='cover' mode='aspectFit' src={item.coverArr[0]} />
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
  navigationBarTitleText: '下载历史'
};
