import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Index from '../views/Index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Index',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: Index
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    // meta: { requiresAuth: true } // 需要登录才能访问
  },
  {
    path: '/user/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/ChangePassword.vue')
  },
  {
    path: '/qa',
    name: 'QuestionAndAnswer',
    component: () => import('@/views/QuestionAndAnswer.vue')
  },
  {
    path: '/questions/:qid',
    name: 'QuestionDetail',
    component: () => import('@/views/QuestionDetail.vue'),
    // 传递参数时，路由会解析 :id 部分并传递给组件
  },
  {
    path: '/aichat',
    name: 'AiChat',
    component: () => import('@/views/ChatAi.vue')
  },
  {
    path: '/collectlaunch',
    name: 'CollectLaunch',
    component: () => import('@/views/CollectLaunch.vue')
  },
  {
    path: '/user/collectlaunch',
    name: 'UserSubmit',
    component: () => import('@/views/UserSubmit.vue')
  },
  {
    path: '/email',
    name: 'Email',
    component: () => import('@/views/Email.vue')
  },
  {
    path: '/manage',
    name: 'Manage',
    component: () => import('@/views/UserManagement.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
