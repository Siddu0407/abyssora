import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const SITE_URL = 'https://abyssora-ten.vercel.app'

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }

    return entities[char]
  })
}

function formatDate(value) {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString()
}

export default async function handler(req, res) {
  try {
    const { data: comics, error } = await supabase
      .from('comics')
      .select('id, status, updated_at, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    const publicComics = (comics || []).filter(
      (comic) =>
        comic.id &&
        String(comic.status || '').trim().toLowerCase() !== 'draft'
    )

    const urls = [
      {
        loc: `${SITE_URL}/`,
        changefreq: 'daily',
        priority: '1.0',
      },

      ...publicComics.map((comic) => ({
        loc: `${SITE_URL}/manga/${encodeURIComponent(comic.id)}`,
        lastmod: formatDate(comic.updated_at || comic.created_at),
        changefreq: 'weekly',
        priority: '0.8',
      })),
    ]

    const uniqueUrls = [
      ...new Map(urls.map((url) => [url.loc, url])).values(),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    )

    return res.status(200).send(xml)
  } catch (error) {
    console.error('Sitemap generation failed:', error)

    return res.status(500).send('Unable to generate sitemap')
  }
}