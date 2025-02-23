import request from '@/utils/requestUtils.js'

// 获取指定动态下的评论（嵌套结构）
// export const getCommentsForMoment = async (momentId) => {
//     const res = await request.get(`/comments/moment/${momentId}`);
//     return res;
// };

// 添加评论（包括回复，parentCommentId 若为 null 则为顶级评论）
// export const addComment = async (data) => {
//     const res = await request.post('/comments/add', data);
//     return res;
// };

// 点赞评论接口（示例，参数根据需求传递）
// export const toggleCommentLike = async (commentId, userId) => {
//     const res = await request.post(`/comments/${commentId}/toggleLike`, null, {
//         params: { userId }
//     });
//     return res;
// };

// 添加评论
export const commentPost = async (momentId, data) => {
    const res = await request.post('/comments/add', { momentId: momentId, ...data });
    return res.data;
};

// 以下为动态相关接口（示例）：
export const getMoments = async () => {
    const res = await request.get('/moments/list');
    return res;
};

export const createMoment = async (data) => {
    const res = await request.post('/moments/create', data);
    return res;
};


export const deleteMoment = async (momentId) => {
    const res = await request.delete(`/moments/delete/${momentId}`);
    return res;
};


export const toggleMomentLike = async (momentId, userId) => {
    // 此处可以设计一个专门的接口，本示例简化处理
    const res = await request.post(`/moments/${momentId}/toggleLike`, null, {
        params: { userId }
    });
    return res;
};

export const uploadMomentPic = (formData) => {
    return request.post('/file/upload-momentpic', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// 获取指定动态下的评论（嵌套结构）
// currentUserId 参数用于判断点赞状态
export const getCommentsForMoment = async (momentId, currentUserId) => {
    return request.get(`/comments/moment/${momentId}`, { params: { userId: currentUserId } });

};

// 添加评论/回复
// 数据中 parentId 为 null 表示顶级评论；非 null 表示回复
export const addComment = async (momentId, data) => {
    return res = await request.post('/comments/add', { momentId, ...data });
};

// 评论点赞接口
export const toggleCommentLike = async (commentId, userId) => {
    return res = await request.post(`/comments/${commentId}/toggleLike`, null, { params: { userId } });
};