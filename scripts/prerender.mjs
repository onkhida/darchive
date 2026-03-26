import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.join(__dirname, '../public/commentary')
const technicalDir = path.join(__dirname, '../public/technical')
const readingsDir = path.join(__dirname, '../public/readings')

const SITE_URL = 'https://onkhida.me'
const IMAGE_URL = 'https://hidden-onk.netlify.app/assets/images/og_image.png'

function extractMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    return data
}

function generateSlug(fileName) {
    const nameNoExt = fileName.replace(/\.md$/, '')
    const firstSpace = nameNoExt.indexOf(' ')
    if (firstSpace === -1) return nameNoExt.toLowerCase()
    return nameNoExt.slice(firstSpace + 1).toLowerCase()
}

function prerender() {
    console.log('Generating metadata and sitemap...')

    const routes = [
        {
            path: '/',
            title: 'Public Archive',
            description: 'An archive. Daniel Eta.',
            image: IMAGE_URL,
            type: 'website'
        },
        {
            path: '/commentary',
            title: 'Commentary - onkhida',
            description: 'Entries on everything I could not fit into structure.',
            image: IMAGE_URL,
            type: 'website'
        },
        {
            path: '/readings',
            title: 'Readings - onkhida',
            description: 'Entries on entities I consume.',
            image: IMAGE_URL,
            type: 'website'
        },
        {
            path: '/technical',
            title: 'Technical - onkhida',
            description: 'Posts on technology.',
            image: IMAGE_URL,
            type: 'website'
        }
    ]

    // Scan commentary
    if (fs.existsSync(contentDir)) {
        const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'))
        files.forEach(file => {
            const slug = generateSlug(file)
            const meta = extractMetadata(path.join(contentDir, file))
            routes.push({
                path: `/c/${slug}`,
                title: `${meta.title || file.replace('.md', '')} | Public Archive`,
                description: meta.description || `${meta.title || file.replace('.md', '')} - A commentary piece.`,
                image: IMAGE_URL,
                type: 'article'
            })
        })
    }

    // Scan technical
    if (fs.existsSync(technicalDir)) {
        const files = fs.readdirSync(technicalDir).filter(f => f.endsWith('.md'))
        files.forEach(file => {
            const slug = generateSlug(file)
            const meta = extractMetadata(path.join(technicalDir, file))
            routes.push({
                path: `/technical/${slug}`,
                title: `${meta.title || file.replace('.md', '')} | Public Archive`,
                description: meta.description || `${meta.title || file.replace('.md', '')} - A technical post.`,
                image: IMAGE_URL,
                type: 'article'
            })
        })
    }

    // Scan readings
    if (fs.existsSync(readingsDir)) {
        const files = fs.readdirSync(readingsDir).filter(f => f.endsWith('.md'))
        files.forEach(file => {
            const slug = generateSlug(file)
            const meta = extractMetadata(path.join(readingsDir, file))
            routes.push({
                path: `/readings/${slug}`,
                title: `${meta.title || file.replace('.md', '')} | Public Archive`,
                description: meta.description || `${meta.title || file.replace('.md', '')} - A reading note.`,
                image: IMAGE_URL,
                type: 'article'
            })
        })
    }

    // Save metadata JSON
    fs.writeFileSync(
        path.join(__dirname, '../public/metadata.json'),
        JSON.stringify(routes, null, 2)
    )

    // Generate sitemap.xml
    const sitemapEntries = routes.map(route => {
        return `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`
    }).join('\n')

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`

    fs.writeFileSync(
        path.join(__dirname, '../public/sitemap.xml'),
        sitemap
    )

    console.log(`Generated metadata for ${routes.length} routes`)
    console.log('Saved to public/metadata.json')
    console.log('Saved sitemap to public/sitemap.xml')
}

prerender()
