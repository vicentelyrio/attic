use sqlx::sqlite::SqliteRow;
use sqlx::{Row, SqlitePool};

use super::model::Favorite;

fn row_to_favorite(row: &SqliteRow) -> Favorite {
    Favorite {
        id: row.get("id"),
        root: row.get("root"),
        path: row.get("path"),
        name: row.get("name"),
        created_at: row.get("created_at"),
    }
}

pub async fn list_for_user(pool: &SqlitePool, user_id: &str) -> Result<Vec<Favorite>, sqlx::Error> {
    let rows = sqlx::query("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at")
        .bind(user_id)
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(row_to_favorite).collect())
}

pub async fn find_for_user(
    pool: &SqlitePool,
    user_id: &str,
    root: &str,
    path: &str,
) -> Result<Option<Favorite>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM favorites WHERE user_id = ? AND root = ? AND path = ?")
        .bind(user_id)
        .bind(root)
        .bind(path)
        .fetch_optional(pool)
        .await?;
    Ok(row.as_ref().map(row_to_favorite))
}

pub async fn add(pool: &SqlitePool, user_id: &str, fav: &Favorite) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO favorites (id, user_id, root, path, name, created_at) \
         VALUES (?, ?, ?, ?, ?, ?) \
         ON CONFLICT (user_id, root, path) DO NOTHING",
    )
    .bind(&fav.id)
    .bind(user_id)
    .bind(&fav.root)
    .bind(&fav.path)
    .bind(&fav.name)
    .bind(fav.created_at)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn remove(pool: &SqlitePool, user_id: &str, id: &str) -> Result<u64, sqlx::Error> {
    let res = sqlx::query("DELETE FROM favorites WHERE id = ? AND user_id = ?")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(res.rows_affected())
}
