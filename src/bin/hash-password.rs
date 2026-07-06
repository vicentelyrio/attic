//! Generate an Argon2id PHC hash for the owner password, to paste into
//! `config.toml` as `[auth].owner_password_hash`. Reads the password from
//! stdin. Standalone so it doesn't require a library target.
//!
//! Usage: `cargo run --bin hash-password`

use std::io::{self, Write};

use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHasher};
use rand::rngs::OsRng;

fn main() {
    print!("Password: ");
    io::stdout().flush().expect("flush");

    let mut pw = String::new();
    io::stdin().read_line(&mut pw).expect("read password");
    let pw = pw.trim_end_matches(['\n', '\r']);

    if pw.len() < 8 {
        eprintln!("password must be at least 8 characters");
        std::process::exit(1);
    }

    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(pw.as_bytes(), &salt)
        .expect("hash password");
    println!("{hash}");
}
