import { createRouter, createWebHistory } from 'vue-router';
import TileViewer from '../pages/TileViewer.vue';
import TileEditor from '../pages/TileEditor.vue';
import Main from '../pages/Main.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Main,
    },
    {
        path: '/viewer',
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
