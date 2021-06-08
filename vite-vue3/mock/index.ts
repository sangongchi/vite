export default [
  {
    url: '/api/get',
    method: 'get',
    response: ({ query }) => {
      return {
        code: 200,
        data: {
          name: 'mock数据',
        },
      };
    },
  },
];
