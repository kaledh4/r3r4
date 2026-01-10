export async function onRequestGet(context) {
    const { request, env, params } = context;

    // 0. Environment Check
    if (!env.USER_DATA) {
        return new Response("KV Namespace 'USER_DATA' is not bound.", { status: 500 });
    }

    // 1. Get Params
    // The filename might be passed as an array due to [[filename]] syntax, or string
    let filename = "";
    if (Array.isArray(params.filename)) {
        filename = params.filename.join('/');
    } else {
        filename = params.filename;
    }

    if (!filename) {
        return new Response("Image ID missing", { status: 400 });
    }

    // 2. Fetch from KV
    // The key format in upload.js is `img:${fileName}`
    const kvKey = `img:${filename}`;

    try {
        // kv.getWithMetadata is used to retrieve content + metadata
        const { value, metadata } = await env.USER_DATA.getWithMetadata(kvKey, { type: 'arrayBuffer' });

        if (!value) {
            return new Response("Image not found", { status: 404 });
        }

        // 3. Serve Image
        return new Response(value, {
            headers: {
                "Content-Type": metadata?.contentType || "image/jpeg",
                "Cache-Control": "public, max-age=86400" // Cache for 1 day
            }
        });

    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}
