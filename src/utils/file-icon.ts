export function getFileIcon(type: string): string {
  // 根据文件类型返回对应的图标
    switch (type) {
      case 'image':
        return 'FileOutlined';
      case 'pdf':
        return 'file-pdf';
      case 'video':
        return 'video';
      default:
        return 'document';
    }
  }