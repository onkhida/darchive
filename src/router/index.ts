import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Commentary from '../views/Commentary.vue'
import CommentaryDetail from '../views/CommentaryDetail.vue'
import Consumables from '../views/Consumables.vue'
import ConsumableDetail from '../views/ConsumableDetail.vue'
import Technical from '../views/Technical.vue'
import TechnicalDetail from '../views/TechnicalDetail.vue'
import TextEditor from '../views/TextEditor.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/commentary',
            name: 'commentary',
            component: Commentary
        },
        {
            path: '/commentary/:slug',
            name: 'commentary-detail',
            component: CommentaryDetail
        },
        // Short alias for commentary detail pages
        {
            path: '/c/:slug',
            name: 'commentary-detail-short',
            component: CommentaryDetail
        },
        {
            path: '/consumables',
            name: 'consumables',
            component: Consumables
        },
        {
            path: '/consumables/:slug',
            name: 'consumable-detail',
            component: ConsumableDetail
        },
        {
            path: '/technical',
            name: 'technical',
            component: Technical
        },
        {
            path: '/technical/:slug',
            name: 'technical-detail',
            component: TechnicalDetail
        },
        {
            path: '/txt',
            name: 'text-editor',
            component: TextEditor
        }
    ]
})

export default router
