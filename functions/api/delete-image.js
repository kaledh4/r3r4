export async function onRequestPost(context) {
    const { request, env } = context;

    // 0. Environment Check
    if (!env.USER_DATA) {
        return new Response("KV Namespace 'USER_DATA' not bound", { status: 500 });
    }

    // 1. Authentication Check
    const cfEmail = request.headers.get('cf-access-authenticated-user-email');
    const pin = request.headers.get('x-radres-pin');
    const systemPin = env.EMERGENCY_PIN || '1234';

    if (!cfEmail && pin !== systemPin) {
        return new Response("Unauthorized", { status: 401 });
    }

    // 2. Process Deletion
    try {
        const url = new URL(request.url);
        const params = await request.json(); // Expect { filename: '...' }
        const filename = params.filename;

        if (!filename) {
            return new Response("Missing filename", { status: 400 });
        }

        // Validate filename format (prevent path traversal or deleting other keys)
        // Format should be "cardId-timestamp" (no path separators)
        if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
            return new Response("Invalid filename", { status: 400 });
        }

        const kvKey = `img:${filename}`;

        // 3. Delete from KV
        await env.USER_DATA.delete(kvKey);

        return new Response(JSON.stringify({
            success: true,
            message: "Image deleted"
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}
