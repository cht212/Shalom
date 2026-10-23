declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SHALOM_ADMIN_EMAIL?: string;
  }
}
