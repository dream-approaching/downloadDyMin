/* eslint-disable no-undef */
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro';
import { View, Text, Button, Image } from '@tarojs/components';
// import dayjs from 'dayjs';
// eslint-disable-next-line no-unused-vars
import { AtMessage } from 'taro-ui';
import step1 from '../../assets/step1.jpg';
import './index.less';

export default function Mine() {
  useDidShow(async () => {
    console.log('didShow');
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

  return (
    <View className='container'>
      <AtMessage />
      <View className='profile-info'>
        <Image className='avatar' src={step1}></Image>
        <View className='info'>
          <Text className='name'>name</Text>
        </View>
      </View>
      <Button openType='getUserInfo' onClick={() => console.log('123', 123)}>
        请授权
      </Button>
      <View className='at-icon at-icon-settings'></View>
      <View className='separate'></View>
    </View>
  );
}

Mine.config = {
  navigationBarTitleText: '我的'
};
