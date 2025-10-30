import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Commentary from '../views/Commentary.vue'
import CommentaryDetail from '../views/CommentaryDetail.vue'
import Readings from '../views/Readings.vue'
import ReadingDetail from '../views/ReadingDetail.vue'
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
        {
            path: '/readings',
            name: 'readings',
            component: Readings
        },
        {
            path: '/readings/:slug',
            name: 'reading-detail',
            component: ReadingDetail
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
