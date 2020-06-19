import Taro from '@tarojs/taro';

const MyToast = (text, icon = 'none', duration = 3000) => {
  Taro.showToast({
    title: text,
    icon,
    duration
  });
};

export default MyToast;
