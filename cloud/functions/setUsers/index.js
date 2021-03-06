const cloud = require('wx-server-sdk')
const dayjs = require('dayjs')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV,
})
const db = cloud.database()
const users = db.collection('users')
const videos = db.collection('videos')

function removeArrIndex(arr, index) {
    const arrBackups = arr
    arr = arrBackups.slice(0, index)
    arr = arr.concat(arrBackups.slice(index + 1))
    return arr
}

const _ = db.command
// 视频的状态
const STATUS = { show: 1, hide: 2 }
exports.main = async (event, context) => {
    const { userInfo, updateObj, type } = event
    console.log('%ctype:', 'color: #0e93e0;background: #aaefe5;', type)
    console.log('%cuserInfo:', 'color: #0e93e0;background: #aaefe5;', userInfo)
    let { OPENID = userInfo.openId, UNIONID } = await cloud.getWXContext()
    console.log('%cOPENID, UNIONID:', 'color: #0e93e0;background: #aaefe5;', OPENID, UNIONID)
    // 先查询用户是否存在
    const filterList = await users
        .where({
            openId: OPENID || userInfo.openId,
        })
        .get()
    console.log('%cfilterList:', 'color: #0e93e0;background: #aaefe5;', filterList)
    let res
    if (!filterList.data.length) {
        const newRecordData = {
            ...userInfo,
            cloudID: userInfo.cloudID,
            encryptedData: userInfo.encryptedData,
            signature: userInfo.signature,
            // rawData: userInfo.rawData,
            openId: OPENID,
            unionId: UNIONID,
            createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            lastLogin: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            downloadTimes: 0,
            downloadArr: [],
            uploadTimes: 0,
            uploadArr: [],
            left: 10, // 默认允许10次下载，否则弹出赞赏提示
            ...updateObj,
        }
        res = await users.add({
            data: newRecordData,
        })
    } else {
        const record = filterList.data[0]
        const datas = {
            ...updateObj,
            ...userInfo,
            updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }
        if (type === 'upload' || type === 'download') {
            const videoRecord = await videos.doc(event.videoId).get()
            if (type === 'upload') {
                datas.uploadTimes = _.inc(1)
            } else {
                datas.downloadTimes = _.inc(1)
                datas.left = record.left - 1
                // 判断下载的视频是否已经存在
                const index = record.downloadArr.findIndex((item) => item.url === videoRecord.data.url)
                let times = 0
                console.log('%cindex:', 'color: #0e93e0;background: #aaefe5;', index)
                if (index > -1) {
                    // times: 这个视频已经下载的次数
                    times = record.downloadArr[index].downloadTimesMine
                    const newArr = removeArrIndex(record.downloadArr, index)
                    datas.downloadArr = [...newArr, { ...videoRecord.data, downloadTimesMine: times + 1, status: STATUS.show }]
                } else {
                    // 只保留近60天内的至多30条历史数据
                    const onehundredDay = dayjs().subtract(60, 'day')
                    console.log('%c zjs datas.downloadArr:', 'color: #0e93e0;background: #aaefe5;', datas.downloadArr)
                    const withInList = datas.downloadArr
                        ? datas.downloadArr.filter((item) => dayjs(item.uploadTime).isAfter(onehundredDay))
                        : []
                    console.log('%c zjs withInList:', 'color: #0e93e0;background: #aaefe5;', withInList)
                    if (withInList.length >= 30) {
                        const only30 = withInList.slice(0, 30)
                        datas.downloadArr = only30
                    }

                    datas.downloadArr = _.push({
                        _id: videoRecord.data._id,
                        coverArr: [videoRecord.data.coverArr[0]],
                        fileId: videoRecord.data.fileId,
                        title: videoRecord.data.title,
                        url: videoRecord.data.url,
                        downloadTimes: videoRecord.data.downloadTimes,
                        uploadTime: videoRecord.data.uploadTime,
                        author: {
                            nickname: videoRecord.data.author.nickname,
                            avatar_thumb: {
                                url_list: [videoRecord.data.author.avatar_thumb.url_list[0]],
                            },
                        },
                        downloadTimesMine: times + 1,
                        status: STATUS.show,
                    })
                }
            }
        }

        res = await users.doc(record._id).update({ data: datas })
    }
    return res
}
