import { createRouter, createWebHashHistory } from 'vue-router';
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
    {
        path: '/#templates',
        name: 'Templates',
        component: Main,
    },
    {
        path: '/#shapesanity',
        name: 'Shapesanity',
        component: Main,
    },
    {
        path: '/#achievements',
        name: 'Achievements',
        component: Main,
    },
    {
        path: '/#textclient',
        name: 'Text Client',
        component: Main,
    },
    {
        path: '/#settings',
        name: 'Settings',
        component: Main,
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
