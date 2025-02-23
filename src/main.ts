import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {createPinia} from 'pinia'
import { createPersistedState } from 'pinia-persistedstate-plugin'
// import axios from 'axios'
// import apiServe from '@/api'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
const app = createApp(App)
const pinia = createPinia();
const persist = createPersistedState();
pinia.use(persist)
// app.config.globalProperties.$axios = axios
// app.config.globalProperties.$http = apiServe
app.use(store).use(router).use(Antd).use(pinia).mount('#app')


