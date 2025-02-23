//定制请求的实例

//导入axios  npm install axios
import axios from 'axios';

import { message } from 'ant-design-vue';
//定义一个变量,记录公共的前缀  ,  baseURL
//const baseURL = 'http://localhost:8080';
const baseURL = '/api';
const instance = axios.create({ baseURL })

import {useTokenStore} from '@/store/token.js'
import useUserInfoStore from '@/store/userInfo.js'

// const tokenStore = useTokenStore();
// const userInfoStore = useUserInfoStore();
//添加请求拦截器
instance.interceptors.request.use(
    (config)=>{
        //请求前的回调
        //添加token
        const tokenStore = useTokenStore();
        //判断有没有token
        if(tokenStore.token){
            config.headers.Authorization = tokenStore.token
        }
        return config;
    },
    (err)=>{
        //请求错误的回调
        Promise.reject(err)
    }
)

/* import {useRouter} from 'vue-router'
const router = useRouter(); */

import router from '@/router'
//添加响应拦截器
instance.interceptors.response.use(
    result => {
        //判断业务状态码
        if(result.data.code === 200){
            return result.data;
        }
 
        //操作失败
        //alert(result.data.msg?result.data.msg:'服务异常')
        console.log("捕捉到错误");
        message.error(result.data.message ? result.data.message : '服务异常');
        return Promise.reject(new Error(result.data.message || '服务异常'));
        
    },
    err => {
        //判断响应状态码,如果为401,则证明未登录,提示请登录,并跳转到登录页面
        if(err.response.status===401){
          message.error('请先登录')
          const tokenStore = useTokenStore();
          const userInfoStore = useUserInfoStore();
          tokenStore.removeToken()
          userInfoStore.removeInfo()
            // router.push('/login')
        }else{
          message.error('服务异常')
        }
       
        return Promise.reject(err);//异步的状态转化成失败的状态
    }
)

export default instance;














// import axios from 'axios'
// import Nprogress from 'nprogress'
// import 'nprogress/nprogress.css'
// import { ElMessage } from 'element-plus'
 
// const http = axios.create({
//   baseURL: 'http://localhost:9000',
//   timeout: 300 * 1000, // 请求超时时间设置为300秒
// })
 
// const NETWORK_ERROR = '网络错误，请联系开发人员'
 
// /**
//  * 请求拦截器
//  */
// http.interceptors.request.use((req) => {
//   console.log('请求拦截器 =>', req)
//   Nprogress.start()
//   return req;
// }, (error) => {
//   Nprogress.done()
//   return Promise.reject(error);
// });
 
// /**
//  * 响应拦截器
//  */
// http.interceptors.response.use(function (res) {
//   console.log('响应拦截器 =>', res)
//   Nprogress.done()
//   if (res.status == 200) {
//     return res.data
//   } else {
//     ElMessage.error((NETWORK_ERROR))
//     return Promise.reject(NETWORK_ERROR)
//   }
// });
 
// export default http
 