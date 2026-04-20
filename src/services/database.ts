import { Capacitor } from '@capacitor/core';
import { Sqlite } from '@capawesome-team/capacitor-sqlite';

const isWeb = Capacitor.getPlatform() === 'web';

class DatabaseService {
  private databaseId: string | null = null;

  private opening: Promise<string> | null = null;

  async initialize(): Promise<void> {
    await this.ensureOpen();
  }

  async query<T>(
    statement: string,
    values: Array<string | number | null> = [],
  ): Promise<T[]> {
    const databaseId = await this.ensureOpen();
    const result = await Sqlite.query({
      databaseId,
      statement,
      values,
    });
    const rows = result.rows ?? [];
    if (rows.length === 0) {
      return [];
    }

    const firstRow = rows[0] as unknown;
    if (!Array.isArray(firstRow)) {
      return rows as unknown as T[];
    }

    const columns = result.columns ?? [];
    return rows.map((row) => {
      const rowValues = row as unknown[];
      return columns.reduce<Record<string, unknown>>(
        (accumulator, column, index) => {
          accumulator[column] = rowValues[index] ?? null;
          return accumulator;
        },
        {},
      );
    }) as unknown as T[];
  }

  async execute(
    statement: string,
    values: Array<string | number | null> = [],
  ): Promise<void> {
    const databaseId = await this.ensureOpen();
    await Sqlite.execute({
      databaseId,
      statement,
      values,
    });
  }

  async beginTransaction(): Promise<void> {
    const databaseId = await this.ensureOpen();
    await Sqlite.beginTransaction({ databaseId });
  }

  async commitTransaction(): Promise<void> {
    const databaseId = await this.ensureOpen();
    await Sqlite.commitTransaction({ databaseId });
  }

  async rollbackTransaction(): Promise<void> {
    const databaseId = await this.ensureOpen();
    await Sqlite.rollbackTransaction({ databaseId });
  }

  async close(): Promise<void> {
    const id = await this.resolveIdForClose();
    if (!id) {
      return;
    }

    try {
      await Sqlite.close({ databaseId: id });
    } catch (error) {
      console.warn('Failed to close SQLite database.', error);
    } finally {
      this.databaseId = null;
      this.opening = null;
    }
  }

  private async ensureOpen(): Promise<string> {
    if (this.databaseId) {
      return this.databaseId;
    }

    if (this.opening) {
      return this.opening;
    }

    this.opening = this.open();

    try {
      this.databaseId = await this.opening;
      return this.databaseId;
    } finally {
      this.opening = null;
    }
  }

  private async resolveIdForClose(): Promise<string | null> {
    if (this.databaseId) {
      return this.databaseId;
    }
    if (this.opening) {
      return this.opening;
    }
    return null;
  }

  private async open(): Promise<string> {
    if (isWeb) {
      const workerUrl = `${import.meta.env.BASE_URL}assets/sqlite-wasm/sqlite3-worker1.mjs`;
      await Sqlite.initialize({
        worker: new Worker(workerUrl, {
          type: 'module',
        }),
      });
    }

    const { databaseId } = await Sqlite.open({
      path: 'expenses.sqlite3',
      version: 1,
      upgradeStatements: [
        {
          version: 1,
          statements: [
            `CREATE TABLE IF NOT EXISTS expenses (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              category TEXT NOT NULL,
              amount REAL NOT NULL,
              expenseDate TEXT NOT NULL,
              notes TEXT,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS application_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              expenseId INTEGER NOT NULL,
              deletedAt TEXT NOT NULL
            )`,
          ],
        },
      ],
    });

    return databaseId;
  }
}

export const databaseService = new DatabaseService();
