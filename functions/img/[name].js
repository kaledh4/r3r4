export async function onRequestGet(context) {
    const { env, params } = context;
    const name = params.name;

    if (!env.USER_DATA) {
        return new Response("KV Namespace Not Found", { status: 500 });
    }

    const kvKey = `img:${name}`;
    const value = await env.USER_DATA.getWithMetadata(kvKey, { type: "arrayBuffer" });

    if (!value || !value.value) {
        return new Response("Image Not Found", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", value.metadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(value.value, {
        headers,
    });
}
