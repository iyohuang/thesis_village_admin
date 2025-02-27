//导入request.js请求工具
import request from '@/utils/requestUtils.js'

//提供调用注册接口的函数
export const testchat = (data) => {
    return request.post('/ai/chatchat', data);
}