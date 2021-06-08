import request from '@/utils/request';

// mock接口
export function getMockData(data: any = {}) {
  return request({
    url: '/api/get',
    method: 'get',
    data,
  });
}
