import { createRouter, createWebHistory } from 'vue-router';
import TileViewer from '../components/TileViewer.vue';
import TileEditor from '../components/TileEditor.vue';

const routes = [
  {
    path: '/',
    name: 'Viewer',
    component: TileViewer,
  },
  {
    path: '/editor',
    name: 'Editor',
    component: TileEditor,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
