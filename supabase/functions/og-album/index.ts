import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Get photo count
    const { count } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("album_id", album.id);

    const siteUrl = "https://www.chinbethelchurch.com";
    const albumUrl = `${siteUrl}/media/album/${album.slug || album.id}`;
    const title = `${album.title} | Chin Bethel Church`;
    const description = album.description || `View ${count || 0} photos from the ${album.title} album at Chin Bethel Church`;
    const image = album.cover_image_url || `${siteUrl}/og-image.jpg`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${albumUrl}" />
  <meta property="og:site_name" content="Chin Bethel Church" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${albumUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${albumUrl}">${album.title}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
