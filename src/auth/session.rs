use axum::http::header::HeaderValue;
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::{Digest, Sha256};

pub const COOKIE_NAME: &str = "vault_session";
pub const SHORT_TTL_HOURS: i64 = 12;

pub fn generate_token() -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}

pub fn hash_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

fn cookie_value(body: String, secure: bool) -> HeaderValue {
    let mut s = body;
    s.push_str("; Path=/; HttpOnly; SameSite=Lax");
    if secure {
        s.push_str("; Secure");
    }
    HeaderValue::from_str(&s).expect("session cookie is valid ascii")
}

pub fn set_cookie(token: &str, max_age: Option<i64>, secure: bool) -> HeaderValue {
    let mut body = format!("{COOKIE_NAME}={token}");
    if let Some(secs) = max_age {
        body.push_str(&format!("; Max-Age={secs}"));
    }
    cookie_value(body, secure)
}

pub fn clear_cookie(secure: bool) -> HeaderValue {
    cookie_value(format!("{COOKIE_NAME}=; Max-Age=0"), secure)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokens_are_long_and_unique() {
        let a = generate_token();
        assert_eq!(a.len(), 64);
        assert_ne!(a, generate_token());
    }

    #[test]
    fn hash_token_is_deterministic_and_not_identity() {
        let t = generate_token();
        assert_eq!(hash_token(&t), hash_token(&t));
        assert_ne!(hash_token(&t), t);
    }

    #[test]
    fn remembered_cookie_carries_max_age() {
        let v = set_cookie("tok", Some(3600), true);
        let s = v.to_str().unwrap();
        assert!(s.contains("Max-Age=3600"));
        assert!(s.contains("HttpOnly"));
        assert!(s.contains("SameSite=Lax"));
        assert!(s.contains("Secure"));
    }

    #[test]
    fn session_cookie_has_no_max_age_and_respects_insecure_dev() {
        let v = set_cookie("tok", None, false);
        let s = v.to_str().unwrap();
        assert!(!s.contains("Max-Age"));
        assert!(!s.contains("Secure"));
        assert!(s.contains("HttpOnly"));
    }

    #[test]
    fn clear_cookie_expires_immediately() {
        let s = clear_cookie(true);
        assert!(s.to_str().unwrap().contains("Max-Age=0"));
    }
}
