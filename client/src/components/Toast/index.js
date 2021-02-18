import Taro from '@tarojs/taro';

const MyToast = (text, duration = 2000, icon = 'none') => {
  Taro.showToast({
    title: text,
    icon,
    duration
  });
};

export default MyToast;
