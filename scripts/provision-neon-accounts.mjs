import { randomBytes, randomUUID, pbkdf2Sync } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL. Configúrala temporalmente para apuntar a Neon.");
}
if (!new URL(connectionString).hostname.endsWith(".neon.tech")) {
  throw new Error("Por seguridad, este script solo se conecta a una base de datos Neon.");
}

const prompt = createInterface({ input: stdin, output: stdout });
const confirmation = await prompt.question(
  "Esto creará cuentas en la base Neon conectada. Escribe PROVISIONAR CUENTAS SHALOM EN NEON para continuar: ",
);
prompt.close();
if (confirmation !== "PROVISIONAR CUENTAS SHALOM EN NEON") {
  throw new Error("Confirmación incorrecta; no se hicieron cambios.");
}

const sql = postgres(connectionString, { max: 1, prepare: false });
const createdPasswords = [];
try {
  await sql.begin(async (tx) => {
    const [{ count }] = await tx`SELECT COUNT(*)::int AS count FROM accounts`;
    if (count !== 0) {
      throw new Error(`La base ya contiene ${count} cuenta(s). No se hicieron cambios.`);
    }

    const churchRows = await tx`SELECT data FROM church WHERE id = 'shalom' FOR UPDATE`;
    const data = churchRows[0]
      ? JSON.parse(churchRows[0].data)
      : { sectors: [], cells: [], people: [], attendance: [], reports: [], devotions: [] };

    let sector = data.sectors.find((item) => item.name.trim().toLowerCase() === "sector 6");
    if (!sector) {
      sector = { id: randomUUID(), name: "Sector 6" };
      data.sectors.push(sector);
    }

    let cell = data.cells.find(
      (item) => item.sector === sector.id && item.name.trim().toLowerCase() === "sector 6",
    );
    if (!cell) {
      cell = { id: randomUUID(), sector: sector.id, name: "Sector 6", leader: "Albert y Jenni", day: "", address: "" };
      data.cells.push(cell);
    } else {
      cell.leader = "Albert y Jenni";
    }

    const users = [
      { username: "admin.shalom", name: "Administrador principal", role: "admin", cell: null },
      { username: "albert", name: "Albert", role: "cell_leader", cell: cell.id },
      { username: "jenni", name: "Jenni", role: "cell_leader", cell: cell.id },
    ];

    for (const user of users) {
      const id = randomUUID();
      const email = `${user.username}@shalom.local`;
      const password = randomBytes(24).toString("base64url");
      const salt = randomBytes(32).toString("hex");
      const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
      await tx`
        INSERT INTO accounts (id, email, name, role, cell, active)
        VALUES (${id}, ${email}, ${user.name}, ${user.role}, ${user.cell}, 1)
      `;
      await tx`
        INSERT INTO credentials (account, username, salt, hash, must_change)
        VALUES (${id}, ${user.username}, ${salt}, ${hash}, 0)
      `;
      createdPasswords.push({ ...user, password });
    }

    const serialized = JSON.stringify(data);
    if (churchRows[0]) {
      await tx`UPDATE church SET data = ${serialized}, revision = revision + 1 WHERE id = 'shalom'`;
    } else {
      await tx`INSERT INTO church (id, data, revision) VALUES ('shalom', ${serialized}, 0)`;
    }
  });

  console.log("\nCuentas creadas. Guarda estas contraseñas ahora; no se almacenaron en un archivo:\n");
  for (const user of createdPasswords) {
    console.log(`${user.name}\nUsuario: ${user.username}\nContraseña: ${user.password}\nRol: ${user.role}\n`);
  }
} finally {
  createdPasswords.length = 0;
  await sql.end();
}
