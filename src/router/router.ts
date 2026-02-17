import { createRouter, createWebHashHistory } from 'vue-router';
import ConnectionTab from '@/pages/tabs/ConnectionTab.vue';
import TemplatesTab from '@/pages/tabs/TemplatesTab.vue';
import ShapesanityTab from '@/pages/tabs/ShapesanityTab.vue';
import AchievementTab from '@/pages/tabs/AchievementTab.vue';
import TextClientTab from '@/pages/tabs/TextClientTab.vue';
import SettingsTab from '@/pages/tabs/SettingsTab.vue';


const routes = [
    {
        path: '/',
        name: 'Connection',
        component: ConnectionTab,
    },
    {
        path: '/templates',
        name: 'Templates',
        component: TemplatesTab,
    },
    {
        path: '/shapesanity',
        name: 'Shapesanity',
        component: ShapesanityTab,
    },
    {
        path: '/achievements',
        name: 'Achievements',
        component: AchievementTab,
    },
    {
        path: '/textclient',
        name: 'Text Client',
        component: TextClientTab,
    },
    {
        path: '/settings',
        name: 'Settings',
        component: SettingsTab,
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
