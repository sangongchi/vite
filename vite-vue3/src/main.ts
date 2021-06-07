import { createApp } from 'vue'
import { ElButton, ElSelect } from 'element-plus';
import App from './App.vue'

const app =  createApp(App);
app.component(ElButton.name, ElButton);
app.component(ElSelect.name, ElSelect);
app.mount('#app')
