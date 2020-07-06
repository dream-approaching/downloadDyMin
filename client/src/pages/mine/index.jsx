import Taro, { useDidShow, useShareAppMessage, useTabItemTap, useState } from '@tarojs/taro';
import { View, Text, Button, Image } from '@tarojs/components';
// import dayjs from 'dayjs';
import { AtMessage, AtCard, AtButton } from 'taro-ui';
import './index.less';

export default function Mine() {
  const [userInfo, setUserInfo] = useState(Taro.getStorageSync('userInfo'));
  const setUserInfoFn = async () => {
    const authSettings = await Taro.getSetting();
    if (authSettings.authSetting['scope.userInfo']) {
      const user = await Taro.getUserInfo();
      Taro.setStorage({ key: 'userInfo', data: user });
      console.log('%cuser:', 'color: #0e93e0;background: #aaefe5;', user);
      setUserInfo(user);
    }
  };

  const [downloadList, setdownloadList] = useState([]);
  useDidShow(async () => {
    await setUserInfoFn();
    try {
      const res = await Taro.cloud.callFunction({
        name: 'getDownloadList'
      });
      setdownloadList(res.result);
    } catch (error) {
      console.log('error 27', error);
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

  useTabItemTap(async () => {
    // await setUserInfoFn();
  });

  const handleClickDownload = async url => {
    console.log('%curl:', 'color: #0e93e0;background: #aaefe5;', url);
    await Taro.setStorage({ key: 'urlFromMine', data: url });
    Taro.switchTab({ url: `/pages/index/index` });
  };

  return (
    <View className='container'>
      <AtMessage />
      {!userInfo ? (
        <Button className='loginBtn' openType='getUserInfo'>
          登录查看下载记录
        </Button>
      ) : (
        <View>
          <View className='profile-info'>
            <Image className='avatar' src={userInfo.userInfo.avatarUrl}></Image>
            <View className='info'>
              <Text className='name'>{userInfo.userInfo.nickName}</Text>
            </View>
          </View>
          <View>
            {downloadList.map(item => {
              return (
                <AtCard
                  renderIcon={<Button>123</Button>}
                  key={item._id}
                  className='itemCon'
                  extra={`热度：${item.downloadTimes}`}
                  // note={item.uploadTime}
                  title={`${item.title.slice(0, 10)}...`}
                >
                  <View className='itemContent'>
                    <Image className='avatar' mode='aspectFit' src={item.coverArr[0]} />
                    <View className='rightContent'>
                      <View>
                        <Text className='title'>{item.title}</Text>
                        <AtButton onClick={() => handleClickDownload(item.url)} className='btn'>
                          下载
                        </AtButton>
                      </View>
                      <Text className='time'>{item.uploadTime}</Text>
                    </View>
                  </View>
                </AtCard>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

Mine.config = {
  navigationBarTitleText: '我的'
};
