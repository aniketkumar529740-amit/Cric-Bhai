
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
        // 1. Verify setup authorization
        const auth = request.headers.get("Authorization");

        if (!env.SETUP_KEY) {
            return Response.json(
                {
                    success: false,
                    code: "SETUP_KEY_MISSING",
                    message: "SETUP_KEY is missing in Cloudflare environment."
                },
                { status: 500 }
            );
        }

        if (auth !== `Bearer ${env.SETUP_KEY}`) {
            return Response.json(
                {
                    success: false,
                    code: "INVALID_SETUP_KEY",
                    message: "Authorization key does not match SETUP_KEY."
                },
                { status: 401 }
            );
        }

        // 2. Read initial admin credentials
        const username = env.INITIAL_ADMIN_USERNAME;
        const password = env.INITIAL_ADMIN_PASSWORD;

        if (!username || !password) {
            return Response.json(
                {
                    success: false,
                    code: "ADMIN_SECRETS_MISSING",
                    message: "Admin username or password is missing."
                },
                { status: 500 }
            );
        }

        // 3. Validate database binding
        if (!env.DB) {
            return Response.json(
                {
                    success: false,
                    code: "DATABASE_BINDING_MISSING",
                    message: "D1 database binding DB is missing."
                },
                { status: 500 }
            );
        }

        // 4. Check whether an admin already exists
        const existing = await env.DB
            .prepare("SELECT id FROM admins LIMIT 1")
            .first();

        if (existing) {
            return Response.json(
                {
                    success: false,
                    code: "ADMIN_ALREADY_EXISTS",
                    message: "Admin account already exists."
                },
                { status: 409 }
            );
        }

        // 5. Hash the admin password
        const passwordHash = await hashPassword(password);

        // 6. Insert admin into D1
        await env.DB.prepare(
            "INSERT INTO admins (username, password_hash) VALUES (?, ?)"
        )
            .bind(username, passwordHash)
            .run();

        return Response.json(
            {
                success: true,
                message: "Admin account created successfully."
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("ADMIN_SETUP_ERROR:", error);

        return Response.json(
            {
                success: false,
                code: "SETUP_FAILED",
                message: "Setup failed. Check Cloudflare Functions logs."
            },
            { status: 500 }
        );
    }
}
