export const getCloudOpenid = async () => {
  return (this.openid =
    this.openid || (await wx.cloud.callFunction({ name: 'login' })).result.OPENID);
};

//最佳方案。
export const getOpenid = async () => {
  (this.openid = this.openid || wx.getStorageSync('openid')) ||
    wx.setStorageSync('openid', await this.getCloudOpenid());
  return this.openid;
};
