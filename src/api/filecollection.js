import request from '@/utils/requestUtils.js'
import { pa } from 'element-plus/es/locale/index.mjs';

//下载文件
export const downloadFile = (data) => {
  // return request.get(`file/download?filepath=${data}`);
  const url = `file/download?filePath=${encodeURIComponent(data)}`
  window.location.href = url;
}

export const collectListService = ({ userId, page, size, createUserId }) => {
  // 构建动态查询参数
  const params = {
    page: String(page),
    size: String(size)
  };

  if (userId !== undefined && userId !== null) {
    params.userId = String(userId);
  }
  if (createUserId != undefined && createUserId != null) {
    params.createUserId = String(createUserId);
  }
  return request.get('/collections/list', { params });
};

export const collectAddService = (title, users, ddl, id) => {
  return request.post('/collections', {
    name: title,
    userIds: users,
    deadline: ddl,
    createUserId: id
  });
}

export const updateCollectService = (id, title, users, ddl) => {
  return request.put(`/collections/${id}`, {
    name: title,
    userIds: users,
    deadline: ddl
  });
}

export const uploadCollectionFile = (data) => {
  return request.post('/file/upload-colfiles', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }});
}

export const removeCollectionUser = (id, userId) => {
  return request.delete(`/collections/${id}/user/${userId}`);
}

export const removeCollectService = (id) => {
  return request.delete(`/collections/${id}`);
}