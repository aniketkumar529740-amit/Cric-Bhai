
const encoder = new TextEncoder();

function toBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}

async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 310000,
            hash: "SHA-256"
        },
        key,
        256
    );

    return `${toBase64(salt)}.${toBase64(new Uint8Array(hash))}`;
}

export async function onRequestPost({ request, env }) {
    try {
        const auth = request.headers.get("Authorization");

        if (!env.SETUP_KEY || auth !== `Bearer ${env.SETUP_KEY}`) {
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const username = env.INITIAL_ADMIN_USERNAME;
        const password = env.INITIAL_ADMIN_PASSWORD;

        if (!username || !password) {
            return Response.json(
                { success: false, message: "Admin secrets missing" },
                { status: 500 }
            );
        }

        const existing = await env.DB
            .prepare("SELECT id FROM admins LIMIT 1")
            .first();

        if (existing) {
            return Response.json(
                { success: false, message: "Admin already exists" },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        await env.DB.prepare(
            "INSERT INTO admins (username, password_hash) VALUES (?, ?)"
        ).bind(username, passwordHash).run();

        return Response.json({
            success: true,
            message: "Admin account created"
        });

    } catch (error) {
        return Response.json(
            { success: false, message: "Setup failed" },
            { status: 500 }
        );
    }
}
