import { Router } from 'express';
import { prisma } from '../index';
import { absUrl, stripHtml } from './export';

// Link previews for messengers/social bots (nginx routes only crawler user-agents here).
const router = Router();

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

router.get('/product/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { costumeTop: true, costumeBottom: true },
  });
  const url = absUrl(`/product/${encodeURIComponent(req.params.slug)}`);
  const title = product ? `${product.nameRu} — ${Number(product.priceByn).toFixed(2)} BYN | Lans Style` : 'Lans Style — Женская одежда из Беларуси';
  const desc = stripHtml(product?.descRu).slice(0, 200) || 'Белорусский бренд женской одежды. Доставка по Беларуси.';
  const image = absUrl(product?.images?.[0] || product?.costumeTop?.images?.[0] || product?.costumeBottom?.images?.[0] || '/hero.jpg');

  res.status(product ? 200 : 404).type('html').set('Cache-Control', 'public, max-age=600').send(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Lans Style" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="canonical" href="${esc(url)}" />
<script>location.replace(${JSON.stringify(url + '?web=1')})</script>
</head><body><a href="${esc(url)}?web=1">${esc(title)}</a></body></html>`);
});

export default router;
