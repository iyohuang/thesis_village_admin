//导入request.js请求工具
import request from '@/utils/requestUtils.js'

//提供调用注册接口的函数
export const userRegisterService = (registerData) => {
    return request.post('/auth/register', registerData);
}

//提供调用登录接口的函数
export const userLoginService = (loginData) => {
    // const params = new URLSearchParams();
    // for(let key in loginData){
    //     params.append(key,loginData[key])
    // }
    return request.post('/auth/login', loginData)
}


//获取用户详细信息
export const userInfoService = () => {
    return request.get('/user/userInfo')
}

//修改个人信息
// export const userInfoUpdateService = (userInfoData) => {
//     return request.put('/user/userInfo', userInfoData)
// }
export const userInfoUpdateService = async (id, data) => {
    return request.put(`/user/userInfo/${id}`, data);
};


//修改头像
// export const userAvatarUpdateService = (avatarUrl) => {
//     const params = new URLSearchParams();
//     params.append('avatarUrl', avatarUrl)
//     return request.patch('/user/updateAvatar', params)
// }

export const uploadAvatar = (formData) => {
    return request.post('/file/upload-avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

//修改密码
export const updatePasswordService = (oldPassword, newPassword) => {
    return request.put('/user/updatePassword', { oldPassword, newPassword });
}

//获取用户列表
export const userListService = () => {
    return request.get('/user/list')
}

//判断是否存在授权码
export const checkAuthCodeService = (userId, email) => {
    return request.get(`/user/isAushCodeExit/${userId}/${email}`);
}

//绑定授权码
export const bindAuthCode = (data) => {
    return request.post(`/user/bindAuthCode`, data);
}

//获得所有用户权限
export const userPermissionListService = ({ page, size, role, username }) => {
    const params = {
        page: String(page),
        size: String(size)
    };
    if (role != undefined && role !== null) {
        params.role = String(role);
    }
    if (username != undefined && username != null) {
        params.username = String(username);
    }
    return request.get('/auth/list', {
        params
    });
}

//更新用户权限
export const updateUserPermissionService = (userid, data) => {
    return request.put(`/auth/${userid}/permissions`, data);
}

export const updateUserRoleService = (userId, newRole) => {
    return request.put(`/auth/${userId}/role`, { role: newRole });
};