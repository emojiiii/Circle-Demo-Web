import CloseIcon from "@/components/CloseIcon";
import { sendCustomMessage } from "@/utils/message";
import { memo, useEffect, useRef } from "react";
import { connect } from "react-redux";
import useDraggable from 'use-draggable-hook';
import { iframeDOMMap, iframeMap } from './index';
import s from './index.module.less';

/**
 * 
 * @param {object} param
 * @param {string} param.url 插件地址
 * @param {object} param.setting 插件配置
 * @param {string} param.setting.width
 * @param {string} param.setting.height
 * @param {object} param.name 插件名称
 * @param {object} param.currentChannelInfo // 当前的频道信息
 * @param {string} param.currentChannelInfo.serverId // 当前的社区id
 * @param {string} param.currentChannelInfo.name // 频道名称
 * @param {string} param.currentChannelInfo.channelId // 频道ID
 * @returns 
 */
const Plugin = ({ url, setting, name, serverRole, userInfo, currentChannelInfo }) => {
    console.log('appUserInfo, serverRole: ', currentChannelInfo)

    const width = setting?.width ?? '375px'
    const height = setting?.width ?? '540px'
    const iframeRef = useRef()

    /**
     * 
     * @param {MessageEvent} evt 
     */
    const handleMessage = (evt) => {
        /**
         * @type {Window} iframe的window对象
         */
        const iframeWindow = iframeRef.current.contentWindow
        if (iframeWindow === evt.source) {
            const {type, uid} = evt.data
            if (type === "getUserInfo") {
                iframeWindow.postMessage({
                    uid,
                    data: {
                        userInfo,
                        serverRole
                    }
                }, "*")
            } else if (type === 'share') {
                /**
                 * 分享的方法
                 */
                sendCustomMessage({
                    channelId: currentChannelInfo.channelId,
                    customEvent: 'share',
                    customExts: {
                        /**
                         * 分享的内容
                         */
                    }
                }).then(() => {
                    /**
                     * 分享成功回调
                     */
                    iframeWindow.postMessage({
                        uid,
                        data: {
                            userInfo,
                            serverRole
                        },
                        code: 0,
                        msg: 'ok'
                    }, "*")
                }).catch(() => {
                    iframeWindow.postMessage({
                        uid,
                        data: {},
                        code: -1,
                        msg: '分享失败'
                    }, "*")
                })
            }
        }
    }

    useEffect(() => {
        /**
         * @type {Window}
         */
        const iframeWindow = iframeRef.current.contentWindow
        window.addEventListener('message', handleMessage)
        iframeWindow.postMessage('测试111', '*')
        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    const {
        target
    } = useDraggable({
        maxDistance: {
            x: {
                min: -1025,
                max: 40
            },
            y: {
                min: -40,
                max: 300
            }
        }
    })

    /**
     * 
     * @param {string} url 
     */
    const handleClose = (url) => {
        /**
         * @type {HTMLDivElement}
         */
        const rootDOM = iframeMap.get(url)
        const iframeDOM = iframeDOMMap.get(rootDOM)
        const body = document.querySelector('body')
        iframeDOM?.unmount()
        rootDOM && body.removeChild(rootDOM)
        iframeMap.delete(url)
    }

    return (
        <div className={s.pluginBody} style={{ width: width, height: height }} ref={target}>
            <div className={s.close} onClick={() => {
                handleClose(url)
            }}>
                <CloseIcon />
            </div>
            <div className={s.drag}>按住此处可进行拖动</div>
            <div className={s.layer}>
                <iframe src={url} className={s.iframe} ref={iframeRef} title={name}></iframe>
            </div>
        </div>
    )
}

const mapStateToProps = ({ app, server }) => {
    return {
        serverRole: app.serverRole,
        appUserInfo: app.appUserInfo,
        userInfo: app.userInfo,
        currentChannelInfo: app.currentChannelInfo
    };
};

const mapDispatchToProps = (dispatch) => {
    return {

    };
};

export default memo(connect(mapStateToProps, mapDispatchToProps)(Plugin))