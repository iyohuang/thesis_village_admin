//导入request.js请求工具
import request from '@/utils/requestUtils.js'

//提供调用注册接口的函数
export const testchat = (data) => {
    return request.post('/ai/chatchat', data);
}

export const getSessions = (userId) => {
    return request.get(`/ai/sessions?userId=${userId}`);
}

export const getMessages = (id) => {
    return request.get(`/ai/messages?sessionId=${id}`);
}

export const PostNewMsg = (data) => {
    return request.post('/ai/messages', data);
}

export const createSession = (data) => {
    return request.post('/ai/sessions', data);
}

export const deleteSession = (id) => {
    return request.delete(`/ai/sessions/${id}`);
}