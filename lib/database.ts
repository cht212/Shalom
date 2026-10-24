import postgres from "postgres";

type QueryResult = Array<Record<string, unknown>> & { count?: number };

function postgresSql(sql: string) {
  let index = 0;
  let result = sql.replace(/\?/g, () => `$${++index}`);
  result = result.replace(/^\s*INSERT OR IGNORE INTO\s+/i, "INSERT INTO ");
  if (/^\s*INSERT INTO\s+/i.test(result) && /INSERT OR IGNORE/i.test(sql)) result += " ON CONFLICT DO NOTHING";
  return result;
}

let sqlClient: ReturnType<typeof postgres> | undefined;

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is unavailable. Add it in Vercel or .env.local.");
  sqlClient ??= postgres(url, { max: 1, prepare: false });
  return sqlClient;
}

export type Statement = {
  bind: (...values: unknown[]) => Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<{ meta: { changes: number } }>;
};

function statement(source: string, values: unknown[] = []): Statement {
  const bind = (...next: unknown[]) => statement(source, next);
  const query = async () => client().unsafe(postgresSql(source), values as Array<string | number | null>) as unknown as Promise<QueryResult>;
  return {
    bind,
    async first<T>() { return ((await query())[0] as T | undefined) ?? null; },
    async all<T>() { return { results: await query() as unknown as T[] }; },
    async run() { const result = await query(); return { meta: { changes: result.count ?? 0 } }; },
  };
}

export function db() {
  return {
    prepare: (sql: string) => statement(sql),
    async batch(statements: Statement[]) { return Promise.all(statements.map((item) => item.run())); },
    async transaction(commands:Array<{sql:string;values:Array<string|number|null>}>){
      await client().begin(async transaction=>{
        for(const command of commands)await transaction.unsafe(postgresSql(command.sql),command.values);
      });
    },
  };
}
