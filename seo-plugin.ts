import type { Plugin } from 'vite'

// Adds origin-dependent SEO output. With no VITE_SITE_URL set, canonical/og:url,
// robots.txt's Sitemap line and sitemap.xml are skipped rather than guessed.
export function seo(siteUrl: string | undefined, apiUrl: string | undefined): Plugin {
  return {
    name: 'flowboard-seo',
    transformIndexHtml() {
      const tags: { tag: string; attrs: Record<string, string>; injectTo: 'head' }[] = []
      if (apiUrl) {
        tags.push({ tag: 'link', attrs: { rel: 'preconnect', href: apiUrl, crossorigin: '' }, injectTo: 'head' })
      }
      if (siteUrl) {
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' },
        )
      }
      return tags
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /']
      if (siteUrl) robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' })
      if (siteUrl) {
        const lastmod = new Date().toISOString().slice(0, 10)
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><lastmod>${lastmod}</lastmod></url>\n</urlset>\n`,
        })
      }
    },
  }
}
