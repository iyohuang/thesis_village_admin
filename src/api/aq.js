import request from '@/utils/requestUtils.js'

/**
 * 标签相关API
 */
export const getTags = () => {
  return request.get('/aq/tags')
}

/**
 * 问题相关API
 */
export const getQuestions = (params = {}) => {
  return request.get('/aq/questions', {
    params: {
      page: 1,
      pageSize: 10,
      ...params
    }
  })
}

export const getQuestionDetail = (qid) => {
  return request.get(`/aq/questions/${qid}`)
}

export const getAnswersForQuestion = (qid) =>{
  return request.get(`/aq/questions/answers/${qid}`)
}

export const createQuestion = (data) => {
  return request.post('/aq/questions', {
    ...data,
    // 新增文件字段
    attachments: data.files.map(f => ({
      file_type: f.type,
      file_url: f.url
    }))
  });
};

export const searchQuestions = (keyword) => {
  return request.get('/aq/questions/search', {
    params: { q: keyword }
  })
}

export const createAnswer = (questionId, data) => {
  return request.post(`/aq/questions/${questionId}/answers`, {
    ...data,
    attachments: data.files.map(f => ({
      file_type: f.type.toUpperCase(),
      file_url: f.url
    }))
  });
};

// export const acceptAnswer = (questionId, answerId) => {
//   return request.patch(`/aq/questions/${questionId}/answers/${answerId}/accept`)
// }

export const getQuestionAnswers = (questionId, params = {}) => {
  return request.get(`/aq/questions/${questionId}/answers`, {
    params: {
      page: 1,
      pageSize: 10,
      ...params
    }
  })
}

/**
 * 评论相关API
 */
export const createComment = (answerId, data) => {
  return request.post(`/aq/answers/${answerId}/comments`, {
    content: data.content,
    attachments: data.files.map(f => ({ // 使用attachments字段
      file_type: f.type.toUpperCase(),
      file_url: f.url
    })),
    parentId: data.parentId
  });
};

export const getAnswerComments = (answerId) => {
  return request.get(`/aq/answers/${answerId}/comments`)
}

export const submitAnswer = (data) => {
  return request.post('/aq/answers', data)
}

export const acceptAnswer = (answerId) => {
  return request.patch(`/aq/answers/${answerId}/toggle-accept`);
};

/**
 * 文件上传API
 */
export const uploadFile = (file, fileType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', fileType); // 添加文件类型参数

  return request.post('/aq/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadApFile = (file) => {

  return request.post('/file/upload-aqfiles', file, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

  /**
   * 其他功能API
   */
  export const reportContent = (data) => {
    return request.post('/aq/reports', {
      targetType: data.targetType, // question/answer/comment
      targetId: data.targetId,
      reason: data.reason
    })
  }