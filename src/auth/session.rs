use axum::http::header::HeaderValue;
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::{Digest, Sha256};

pub const COOKIE_NAME: &str = "vault_session";

/// TTL for a plain sign-in (no "keep me signed in"): the session dies fairly
/// soon. "Keep me signed in" uses `AuthConfig::session_ttl_days` instead.
pub const SHORT_TTL_HOURS: i64 = 12;

/// A fresh opaque session token (256 bits, hex). This is the value that goes in
/// the cookie; only its hash is ever persisted.
pub fn generate_token() -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// sha256 of a token, hex-encoded — the primary key in the `sessions` table. A
/// leaked database therefore can't be replayed as live cookies.
pub fn hash_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

fn cookie_value(body: String, secure: bool) -> HeaderValue {
    let mut s = body;
    s.push_str("; Path=/; HttpOnly; SameSite=Lax");
    if secure {
        s.push_str("; Secure");
    }
    // Values are hex/fixed text, always valid header bytes.
    HeaderValue::from_str(&s).expect("session cookie is valid ascii")
}

/// A `Set-Cookie` value that installs the session for `ttl_secs`.
pub fn set_cookie(token: &str, ttl_secs: i64, secure: bool) -> HeaderValue {
    cookie_value(format!("{COOKIE_NAME}={token}; Max-Age={ttl_secs}"), secure)
}

/// A `Set-Cookie` value that immediately clears the session cookie.
pub fn clear_cookie(secure: bool) -> HeaderValue {
    cookie_value(format!("{COOKIE_NAME}=; Max-Age=0"), secure)
}
