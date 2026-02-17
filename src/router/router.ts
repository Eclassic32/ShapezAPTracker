import { createRouter, createWebHashHistory } from 'vue-router';
import ConnectionTab from '@/components/ConnectionTab.vue';
import TemplatesTab from '@/components/TemplatesTab.vue';
import ShapesanityTab from '@/components/ShapesanityTab.vue';
import AchievementTab from '@/components/AchievementTab.vue';
import TextClientTab from '@/components/TextClientTab.vue';
import SettingsTab from '@/components/SettingsTab.vue';


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
