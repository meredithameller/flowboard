import { describe, expect, it, vi } from 'vitest'
import type { Plugin } from 'vite'
import html from '../index.html?raw'
import { seo } from '../seo-plugin'

const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content')

describe('index.html (SEO / GEO regression)', () => {
  it('has a descriptive title and meta description', () => {
    expect(doc.title).toBe('Flowboard – Team Kanban Board')
    expect(meta('meta[name="description"]')).toMatch(/Kanban/)
    expect(meta('meta[name="description"]')!.length).toBeGreaterThan(70)
    expect(meta('meta[name="description"]')!.length).toBeLessThanOrEqual(200)
  })

  it('declares lang, viewport, theme-color and robots', () => {
    expect(doc.documentElement.lang).toBe('en')
    expect(meta('meta[name="viewport"]')).toContain('width=device-width')
    expect(meta('meta[name="theme-color"]')).toBeTruthy()
    expect(meta('meta[name="robots"]')).toContain('index')
  })

  it('has Open Graph and Twitter tags', () => {
    for (const p of ['og:type', 'og:site_name', 'og:title', 'og:description']) {
      expect(meta(`meta[property="${p}"]`), p).toBeTruthy()
    }
    for (const n of ['twitter:card', 'twitter:title', 'twitter:description']) {
      expect(meta(`meta[name="${n}"]`), n).toBeTruthy()
    }
  })

  it('has valid WebApplication JSON-LD', () => {
    const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('WebApplication')
    expect(ld.name).toBe('Flowboard')
  })

  it('applies the saved theme before first paint', () => {
    const inline = [...doc.querySelectorAll('script:not([src]):not([type])')].map((s) => s.textContent)
    expect(inline.some((t) => t!.includes('flowboard.theme') && t!.includes('dataset.theme'))).toBe(true)
  })

  it('ships crawlable fallback content inside #root', () => {
    const root = doc.getElementById('root')!
    expect(root.querySelectorAll('h1')).toHaveLength(1)
    expect(root.querySelector('main p')?.textContent).toMatch(/Backlog.*Done/s)
  })
})

describe('seo() build plugin', () => {
  const run = (site?: string, api?: string) => {
    const plugin = seo(site, api) as Required<Pick<Plugin, 'transformIndexHtml' | 'generateBundle'>>
    const emitted: Record<string, string> = {}
    const ctx = { emitFile: vi.fn((f: { fileName: string; source: string }) => void (emitted[f.fileName] = f.source)) }
    const tags = (plugin.transformIndexHtml as () => { tag: string; attrs: Record<string, string> }[])()
    ;(plugin.generateBundle as unknown as (this: typeof ctx) => void).call(ctx)
    return { tags, emitted }
  }

  it('always emits robots.txt that allows crawling', () => {
    const { emitted } = run()
    expect(emitted['robots.txt']).toContain('User-agent: *')
    expect(emitted['robots.txt']).toContain('Allow: /')
  })

  it('without a site URL, skips canonical, og:url, sitemap and the Sitemap line', () => {
    const { tags, emitted } = run(undefined, 'https://api.test')
    expect(emitted['sitemap.xml']).toBeUndefined()
    expect(emitted['robots.txt']).not.toContain('Sitemap')
    expect(tags.find((t) => t.attrs.rel === 'canonical')).toBeUndefined()
    expect(tags.find((t) => t.attrs.property === 'og:url')).toBeUndefined()
  })

  it('with a site URL, emits canonical, og:url, sitemap.xml and the Sitemap line', () => {
    const { tags, emitted } = run('https://flow.test', 'https://api.test')
    expect(tags.find((t) => t.attrs.rel === 'canonical')?.attrs.href).toBe('https://flow.test/')
    expect(tags.find((t) => t.attrs.property === 'og:url')?.attrs.content).toBe('https://flow.test/')
    expect(emitted['sitemap.xml']).toContain('<loc>https://flow.test/</loc>')
    expect(emitted['robots.txt']).toContain('Sitemap: https://flow.test/sitemap.xml')
  })

  it('preconnects to the API origin', () => {
    const { tags } = run(undefined, 'https://api.test')
    expect(tags.find((t) => t.attrs.rel === 'preconnect')?.attrs.href).toBe('https://api.test')
  })
})
