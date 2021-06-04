import Taro from "@tarojs/taro";
import React, { Component } from "react";
import "taro-ui/dist/style/index.scss";
import dayjs from "dayjs";
import MyToast from "./components/Toast";

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {
  async componentDidMount() {
    if (process.env.TARO_ENV === "weapp") {
      await Taro.cloud.init();

      // 如果已经授权，则更新一下lastLogin
      const userInfo = await this.getUserInfo();
      const openId = await this.getOpenid();
      console.log(
        "%c zjs userInfo:",
        "color: #0e93e0;background: #aaefe5;",
        userInfo
      );
      await wx.cloud.callFunction({
        name: "setUsers",
        data: {
          userInfo: { ...userInfo, openId },
          updateObj: { lastLogin: dayjs().format("YYYY-MM-DD HH:mm:ss") }
        }
      });

      // 检查更新
      const updateManager = Taro.getUpdateManager();
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        console.log("%cres311:", "color: #0e93e0;background: #aaefe5;", res);
        // 我自己的openID
        if (openId === "os-Aw5Z6jNjBxcIf_4Uzkt6QW2PA") {
          MyToast(JSON.stringify(res), 3000);
        }
      });
      updateManager.onUpdateReady(function() {
        Taro.showModal({
          title: "更新提示",
          content: "新版本已经准备好，是否重启应用？",
          success: function(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate();
            }
          }
        });
      });
      updateManager.onUpdateFailed(function(res) {
        console.log("%cres326:", "color: #0e93e0;background: #aaefe5;", res);
        // 新的版本下载失败
      });
    }
  }

  componentDidShow() {}

  componentDidHide() {}

  componentDidCatchError() {}

  getCloudOpenid = async () => {
    return (this.openid =
      this.openid ||
      (await wx.cloud.callFunction({ name: "login" })).result.OPENID);
  };

  //最佳方案。
  getOpenid = async () => {
    (this.openid = this.openid || wx.getStorageSync("openid")) ||
      wx.setStorageSync("openid", await this.getCloudOpenid());
    return this.openid;
  };

  getUserInfo = async callback => {
    const userInStorage = Taro.getStorageSync("userInfo");
    const failFn = () => {
      wx.showToast({ title: "获取信息失败", icon: "error" });
    };
    if (!userInStorage) {
      return new Promise((resolve, reject) => {
        Taro.showModal({
          title: "授权提示",
          content:
            "需要获取您的基本信息，用于完善用户资料，请点击“确认”后按操作提示授权",
          success: res => {
            if (res.confirm) {
              wx.getUserProfile({
                desc: "用于完善用户资料",
                success: res => {
                  Taro.setStorageSync("userInfo", res.userInfo);
                  callback && callback(res.userInfo);
                  resolve(res.userInfo);
                },
                fail: () => {
                  failFn();
                  reject(null);
                }
              });
            } else if (res.cancel) {
              failFn();
              reject(null);
            }
          }
        });
      });
    }
    return userInStorage;
  };

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return this.props.children;
  }
}

export default App;
