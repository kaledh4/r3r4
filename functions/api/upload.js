export async function onRequestPost(context) {
    const { request, env } = context;

    // 0. Environment Check (Use USER_DATA KV since R2 is not available/free tier issue)
    if (!env.USER_DATA) {
        return new Response(JSON.stringify({
            success: false,
            error: "KV Namespace 'USER_DATA' is not bound. Please check Cloudflare Settings."
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 1. Authentication Check (PIN or CF Access)
    const cfEmail = request.headers.get('cf-access-authenticated-user-email');
    const pin = request.headers.get('x-radres-pin');
    const systemPin = env.EMERGENCY_PIN || '1234';

    if (!cfEmail && pin !== systemPin) {
        return new Response("Unauthorized", { status: 401 });
    }

    // 2. Process Multi-part Form Data
    try {
        const formData = await request.formData();
        const file = formData.get('image');
        const cardId = formData.get('cardId');

        if (!file || !cardId) {
            return new Response("Missing image or cardId", { status: 400 });
        }

        // 3. Store in KV
        const fileName = `${cardId}-${Date.now()}`;
        const kvKey = `img:${fileName}`;

        // Convert file to array buffer for KV storage
        const buffer = await file.arrayBuffer();

        // Save binary data with metadata
        await env.USER_DATA.put(kvKey, buffer, {
            metadata: { contentType: file.type }
        });

        return new Response(JSON.stringify({
            success: true,
            url: `/img/${fileName}`
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}
