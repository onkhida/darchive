import { watch } from 'vue'
import { useRoute } from 'vue-router'

export interface MetaTagConfig {
    title: string
    description: string
    image?: string // defaults to og_image.png if not provided
    url?: string
    type?: 'website' | 'article'
    author?: string
}

const DEFAULT_TITLE = 'Public Archive'
const DEFAULT_DESCRIPTION = 'A collection of thoughts, readings, and technical explorations.'
const DEFAULT_IMAGE = '/assets/images/og_image.png'
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''

/**
 * Sets up and manages Open Graph and social media meta tags
 * Supports dynamic updates as route changes or props update
 */
export function useMetaTags(config: MetaTagConfig | (() => MetaTagConfig)) {
    const route = useRoute()

    const updateMetaTags = (metaConfig: MetaTagConfig) => {
        const {
            title = DEFAULT_TITLE,
            description = DEFAULT_DESCRIPTION,
            image = DEFAULT_IMAGE,
            url = SITE_URL + route.fullPath,
            type = 'website',
            author,
        } = metaConfig

        // Ensure image is absolute URL
        const absoluteImage = image.startsWith('http') ? image : SITE_URL + image

        // Update document title
        document.title = title

        // Helper function to update or create meta tag
        const setMeta = (property: string, content: string, attribute: 'property' | 'name' = 'property') => {
            let element = document.querySelector(`meta[${attribute}="${property}"]`)
            if (!element) {
                element = document.createElement('meta')
                element.setAttribute(attribute, property)
                document.head.appendChild(element)
            }
            element.setAttribute('content', content)
        }

        // Open Graph tags
        setMeta('og:title', title)
        setMeta('og:description', description)
        setMeta('og:image', absoluteImage)
        setMeta('og:url', url)
        setMeta('og:type', type)

        // Twitter Card tags
        setMeta('twitter:title', title, 'name')
        setMeta('twitter:description', description, 'name')
        setMeta('twitter:image', absoluteImage, 'name')
        setMeta('twitter:card', 'summary_large_image', 'name')

        // Standard meta tags
        setMeta('description', description, 'name')

        // Article-specific tags
        if (type === 'article' && author) {
            setMeta('article:author', author)
        }

        // Additional social media support
        // LinkedIn
        setMeta('og:image:width', '1200')
        setMeta('og:image:height', '630')

        // Pinterest
        setMeta('pinterest:description', description)

        // Facebook App ID (optional - uncomment if you have one)
        // setMeta('fb:app_id', 'YOUR_FB_APP_ID')
    }

    // Watch for changes and update meta tags
    watch(
        () => typeof config === 'function' ? config() : config,
        (newConfig) => updateMetaTags(newConfig),
        { immediate: true, deep: true }
    )
}

/**
 * Metadata configuration for all pages
 * Returns page-specific meta config based on route
 */
export function getPageMetadata(slug?: string, type?: 'commentary' | 'reading' | 'technical'): MetaTagConfig {
    const baseConfig: Record<string, MetaTagConfig> = {
        home: {
            title: 'Public Archive',
            description: 'A collection of thoughts, readings, and technical explorations.',
            image: '/assets/images/og_image.png',
            type: 'website',
        },
        commentary: {
            title: 'Commentary | Public Archive',
            description: 'Essays and reflections on life, culture, and ideas.',
            image: '/assets/images/og_image.png',
            type: 'website',
        },
        readings: {
            title: 'Readings | Public Archive',
            description: 'Books and articles that shaped my thinking.',
            image: '/assets/images/og_image.png',
            type: 'website',
        },
        technical: {
            title: 'Technical | Public Archive',
            description: 'Deep dives into technical concepts and implementations.',
            image: '/assets/images/og_image.png',
            type: 'website',
        },
    }

    // Return base config or allow for slug-specific overrides
    if (slug && type) {
        // In the future, you could load from content metadata or a database
        // For now, return base category config
        return baseConfig[type] as MetaTagConfig || baseConfig['home'] as MetaTagConfig
    }

    return baseConfig['home'] as MetaTagConfig
}
