import request from '@/utils/requestUtils.js'

//发送邮件,包含附件,json格式
export const sendEmail = (data) => {
    return request.post('/email/send', data, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export const getAllEmailUsers = () => {
    return request.get('/email/users');
}

export const getEmailHistory = () => {
    return request.get('/email/history');
}

export const getAvailableEmails = () => {
    return request.get('/email/available');
}