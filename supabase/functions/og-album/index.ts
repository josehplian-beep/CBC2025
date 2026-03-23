import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // No CORS needed - this endpoint is accessed directly by browsers/crawlers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug parameter", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isNumeric = /^\d+$/.test(slug);
    const query = isNumeric
      ? supabase.from("albums").select("id, title, description, cover_image_url, slug").eq("slug", parseInt(slug)).eq("is_published", true).single()
      : supabase.from("albums").select("id, title, description, cover_image_url, slug").eq("id", slug).eq("is_published", true).single();

    const { data: album, error } = await query;

    if (error || !album) {
      return new Response("Album not found", { status: 404 });
    }

    const { count } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("album_id", album.id);

    const siteUrl = "https://www.chinbethelchurch.com";
    const albumUrl = `${siteUrl}/media/album/${album.slug || album.id}`;
    const title = `${album.title} | Chin Bethel Church`;
    const description = album.description || `View ${count || 0} photos from the ${album.title} album at Chin Bethel Church`;
    const image = album.cover_image_url || `${siteUrl}/og-image.jpg`;

    // Detect if request is from a crawler/bot
    const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
    const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|bot|crawler|spider|preview/i.test(userAgent);

    // For regular users, redirect immediately
    if (!isCrawler) {
      return new Response(null, {
        status: 302,
        headers: { "Location": albumUrl },
      });
    }

    // For crawlers, serve OG meta tags
    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${albumUrl}" />
  <meta property="og:site_name" content="Chin Bethel Church" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${albumUrl}" />
</head>
<body>
  <h1>${album.title}</h1>
  <p>${description}</p>
  <p><a href="${albumUrl}">View Album</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
