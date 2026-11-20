
function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
}

function getMetaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const patterns = [
    new RegExp(
      `<meta\\b[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["'][^>]*>`,
      'i'
    ),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1].trim())
  }

  return ''
}

function getJsonLd(html) {
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ]

  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim())
      const items = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        const data = item?.['@graph']
          ? item['@graph']
          : [item]

        for (const entry of data) {
          if (!entry || typeof entry !== 'object') continue

          const type = entry['@type']
          const types = Array.isArray(type) ? type : [type]

          if (
            types.some((value) =>
              ['ComicStory', 'CreativeWork', 'Book', 'WebPage'].includes(value)
            )
          ) {
            const author = Array.isArray(entry.author)
              ? entry.author[0]
              : entry.author

            return {
              title:
                typeof entry.name === 'string'
                  ? entry.name
                  : '',
              description:
                typeof entry.description === 'string'
                  ? entry.description
                  : '',
              creator:
                typeof author === 'string'
                  ? author
                  : author?.name || '',
              image:
                typeof entry.image === 'string'
                  ? entry.image
                  : entry.image?.url || '',
            }
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD and continue with page metadata.
    }
  }

  return {}
}

function normaliseImageUrl(value, pageUrl) {
  if (!value) return ''

  try {
    const imageUrl = new URL(value, pageUrl)

    if (imageUrl.protocol !== 'https:') return ''

    return imageUrl.href
  } catch {
    return ''
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    })
  }

  try {
    const submittedUrl = req.body?.url

    if (typeof submittedUrl !== 'string' || !submittedUrl.trim()) {
      return res.status(400).json({
        error: 'Please provide a comic URL.',
      })
    }

    let pageUrl

    try {
      pageUrl = new URL(submittedUrl.trim())
    } catch {
      return res.status(400).json({
        error: 'Please enter a valid URL.',
      })
    }

    const hostname = pageUrl.hostname.toLowerCase()

    if (
      pageUrl.protocol !== 'https:' ||
      !(
        hostname === 'webcomicsapp.com' ||
        hostname.endsWith('.webcomicsapp.com')
      )
    ) {
      return res.status(400).json({
        error: 'This importer currently supports WebComics URLs only.',
      })
    }

    const response = await fetch(pageUrl.href, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
      headers: {
        Accept: 'text/html',
      },
    })

    const finalUrl = new URL(response.url)

    if (
      finalUrl.protocol !== 'https:' ||
      !(
        finalUrl.hostname === 'webcomicsapp.com' ||
        finalUrl.hostname.endsWith('.webcomicsapp.com')
      )
    ) {
      return res.status(400).json({
        error: 'The comic page redirected outside WebComics. Import stopped.',
      })
    }

    if (!response.ok) {
      return res.status(502).json({
        error: `WebComics returned HTTP ${response.status}. You can enter the details manually.`,
      })
    }

    const contentType = response.headers.get('content-type') || ''

    if (!contentType.toLowerCase().includes('text/html')) {
      return res.status(415).json({
        error: 'The supplied URL did not return an HTML page.',
      })
    }

    const html = (await response.text()).slice(0, 1_500_000)

    const jsonLd = getJsonLd(html)

    const title =
      getMetaContent(html, 'og:title') ||
      getMetaContent(html, 'twitter:title') ||
      jsonLd.title ||
      ''

    const description =
      getMetaContent(html, 'og:description') ||
      getMetaContent(html, 'description') ||
      jsonLd.description ||
      ''

    const creator =
      getMetaContent(html, 'article:author') ||
      getMetaContent(html, 'author') ||
      jsonLd.creator ||
      ''

    const rawImage =
      getMetaContent(html, 'og:image') ||
      getMetaContent(html, 'twitter:image') ||
      jsonLd.image ||
      ''

    const coverImage = normaliseImageUrl(rawImage, finalUrl.href)

    return res.status(200).json({
      success: true,
      provider: 'WebComics',
      source_url: pageUrl.href,
      title,
      creator_name: creator,
      description,
      cover_image_url: coverImage,
      genres: [],
      message:
        title || description || coverImage || creator
          ? 'Some public page information was found. Please review it before saving.'
          : 'The page did not expose usable metadata. Please enter the details manually.',
    })
  } catch (error) {
    console.error('Comic metadata import error:', error)

    const timedOut =
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'

    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? 'The website took too long to respond. Please enter the details manually.'
        : 'Metadata could not be retrieved from this page. Please enter the details manually.',
    })
  }
}
