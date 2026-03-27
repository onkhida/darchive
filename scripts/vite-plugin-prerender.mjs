import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SITE_URL = 'https://hidden-onk.netlify.app'
const IMAGE_URL = 'https://hidden-onk.netlify.app/assets/images/og_image.png'

/**
 * Extract metadata from markdown frontmatter
 */
function extractMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    return data
}

/**
 * Generate slug from filename
 */
function generateSlug(fileName) {
    const nameNoExt = fileName.replace(/\.md$/, '')
    const firstSpace = nameNoExt.indexOf(' ')
    if (firstSpace === -1) return nameNoExt.toLowerCase()
    return nameNoExt.slice(firstSpace + 1).toLowerCase().replace(/\s+/g, '-')
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Vite plugin for pre-rendering routes
 */
export default function vitePluginPrerender(options = {}) {
    const {
        distDir = 'dist',
        routes = [],
    } = options

    return {
        name: 'vite-plugin-prerender',
        apply: 'build',
        async closeBundle() {
            console.log('\n Pre-rendering static pages...')

            try {
                // Collect all routes from markdown files
                const allRoutes = collectRoutes()

                // Create HTML files for each route
                for (const route of allRoutes) {
                    await createStaticFile(distDir, route)
                }

                console.log(`Pre-rendered ${allRoutes.length} routes`)
            } catch (error) {
                console.error('Pre-rendering failed:', error)
                throw error
            }
        },
    }
}

/**
 * Collect all routes from markdown files
 */
function collectRoutes() {
    const commentaryDir = path.join(__dirname, '../public/commentary')
    const technicalDir = path.join(__dirname, '../public/technical')
    const readingsDir = path.join(__dirname, '../public/readings')

    const routes = [
        {
            path: '/',
            title: 'Public Archive',
            description: 'An archive. Daniel Eta.',
            type: 'website',
        },
        {
            path: '/commentary',
            title: 'Commentary - onkhida',
            description: 'Entries on everything I could not fit into structure.',
            type: 'website',
        },
        {
            path: '/readings',
            title: 'Readings - onkhida',
            description: 'Entries on entities I consume.',
            type: 'website',
        },
        {
            path: '/technical',
            title: 'Technical - onkhida',
            description: 'Posts on technology.',
            type: 'website',
        },
    ]

    // Scan commentary
    if (fs.existsSync(commentaryDir)) {
        const files = fs.readdirSync(commentaryDir).filter((f) => f.endsWith('.md'))
        files.forEach((file) => {
            const slug = generateSlug(file)
            const meta = extractMetadata(path.join(commentaryDir, file))
            routes.push({
                path: `/c/${slug}`,
                title: `${meta.title || file.replace('.md', '')} - onkhida`,
                description:
                    meta.description || `${meta.title || file.replace('.md', '')}`,
                image: meta.image || IMAGE_URL,
                type: 'article',
                author: 'Onkhida',
            })
        })
    }

    // Scan technical
    if (fs.existsSync(technicalDir)) {
        const files = fs.readdirSync(technicalDir).filter((f) => f.endsWith('.md'))
        files.forEach((file) => {
            const slug = generateSlug(file)
            const meta = extractMetadata(path.join(technicalDir, file))
            routes.push({
                path: `/technical/${slug}`,
                title: `${meta.title || file.replace('.md', '')} - onkhida`,
                description:
                    meta.description || `${meta.title || file.replace('.md', '')}`,
                image: meta.coverImage || IMAGE_URL,
                type: 'article',
                author: 'Onkhida',
            })
        })
    }

    // Scan readings
    if (fs.existsSync(readingsDir)) {
        const files = fs.readdirSync(readingsDir).filter((f) => f.endsWith('.md'))
        files.forEach((file) => {
            const slug = generateSlug(file)
            const meta = extractMetadata(path.join(readingsDir, file))
            routes.push({
                path: `/readings/${slug}`,
                title: `${meta.title || file.replace('.md', '')} - onkhida`,
                description:
                    meta.description || `${meta.title || file.replace('.md', '')}`,
                image: meta.image || IMAGE_URL,
                type: 'article',
                author: 'Onkhida',
            })
        })
    }

    return routes
}

/**
 * Create static HTML file for a route
 */
async function createStaticFile(distDir, route) {
    // Read the base index.html
    const indexPath = path.join(distDir, 'index.html')
    let html = fs.readFileSync(indexPath, 'utf-8')

    const title = escapeHtml(route.title)
    const description = escapeHtml(route.description)
    const url = SITE_URL + route.path
    const type = route.type || 'website'
    const image = route.image ? (route.image.startsWith('http') ? route.image : SITE_URL + route.image) : IMAGE_URL

    // Replace meta tags using content matching (more robust than hardcoded strings)
    html = html.replace(
        /(<meta property="og:type" content=")website(" \/?>)/,
        `$1${type}$2`
    )
    html = html.replace(
        /(<meta property="og:url" content=")https:\/\/onkhida\.me\/(" \/?>)/,
        `$1${url}$2`
    )
    html = html.replace(
        /(<meta property="og:title" content=")[^"]*(" \/?>)/,
        `$1${title}$2`
    )
    html = html.replace(
        /(<meta property="og:description" content=")[^"]*(" \/?>)/,
        `$1${description}$2`
    )
    html = html.replace(
        /(<meta property="og:image" content=")[^"]*(" \/?>)/,
        `$1${escapeHtml(image)}$2`
    )
    html = html.replace(
        /(<meta name="description" content=")[^"]*(" \/?>)/,
        `$1${description}$2`
    )
    html = html.replace(
        /(<meta name="twitter:url" content=")https:\/\/onkhida\.me\/(" \/?>)/,
        `$1${url}$2`
    )
    html = html.replace(
        /(<meta name="twitter:title" content=")[^"]*(" \/?>)/,
        `$1${title}$2`
    )
    html = html.replace(
        /(<meta name="twitter:description" content=")[^"]*(" \/?>)/,
        `$1${description}$2`
    )
    html = html.replace(
        /(<meta name="twitter:image" content=")[^"]*(" \/?>)/,
        `$1${escapeHtml(image)}$2`
    )
    html = html.replace(
        /(<title>)[^<]*(<\/title>)/,
        `$1${title}$2`
    )
    html = html.replace(
        /(<meta name="title" content=")[^"]*(" \/?>)/,
        `$1${title}$2`
    )

    // Create directory structure for the route
    let filePath
    if (route.path === '/') {
        filePath = path.join(distDir, 'index.html')
    } else {
        const routePath = route.path.replace(/^\//, '')
        const dirPath = path.join(distDir, routePath)
        fs.mkdirSync(dirPath, { recursive: true })
        filePath = path.join(dirPath, 'index.html')
    }

    // Write the file
    fs.writeFileSync(filePath, html)
    console.log(`  ✓ ${route.path}`)
}
