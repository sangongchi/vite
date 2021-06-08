import Axios from 'axios';
const axios = Axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 超时
  baseURL: 'http://localhost:8000', // 请求接口地址，后面需要在vue.config.js里面配置代理，实际请求得地址不是这个。
});

// 请求拦截
axios.interceptors.request.use((req) => {
  if (req.method === 'get') {
    const url = req.url;
    const t = new Date().getTime();
    if (url.indexOf('?') >= 0) {
      req.url = `${url}&t=${t}`;
    } else {
      req.url = `${url}?t=${t}`;
    }
  }
  return req;
});
axios.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 响应失败统一处理
    const { response } = error;
    if (response) {
      console.log(response);
      switch (response.status) {
        case 400:
          console.error('请求无效');
          break;
        case 401:
          console.error({ message: '尚未登录请重新登录' });
          break;
        case 403:
          console.error('您没有权限这样做，请联系管理员');
          break;
        case 404:
          console.error('请求未找到');
          break;
        case 500:
          console.error('系统异常');
          break;
        case 504:
          console.error('请求超时，请稍后再试');
          break;
        default:
          console.error('系统异常');
          break;
      }
    }
    return Promise.reject(error);
  }
);
export default axios;
