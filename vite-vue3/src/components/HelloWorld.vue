<template>
  <h1>{{ msg }}</h1>
  <el-button @click="getData">mockGet请求</el-button>
  <el-button type="primary"> 测试--</el-button>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue';
import { getMockData } from '@/api/index.ts';

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  setup: () => {
    const count = ref(0);
    return { count };
  },
  methods: {
    async getData() {
      try {
        let data = await getMockData();
        console.log('出发get请求', data);
      } catch (e) {
        console.log(e);
      }
    },
  },
});
</script>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
