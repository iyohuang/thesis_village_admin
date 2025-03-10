import request from '@/utils/requestUtils.js'

//发送邮件,包含附件,json格式
export const sendEmail = (data) => {
    return request.post('/email/send', data, { headers: { 'Content-Type': 'multipart/form-data' } });
}