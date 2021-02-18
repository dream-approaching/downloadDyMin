export default {
  pages: ['pages/index/index','pages/mine/index'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  cloud: true,
  tabBar: {
    color: '#666',
    selectedColor: '#5790e4',
    list: [
      {
        pagePath: 'pages/index/index',
        // text: '下载',
        iconPath: 'assets/download.png',
        selectedIconPath: 'assets/download_a.png'
      },
      {
        pagePath: 'pages/mine/index',
        // text: '历史',
        iconPath: 'assets/mine.png',
        selectedIconPath: 'assets/mine_a.png'
      }
    ]
  }
}
