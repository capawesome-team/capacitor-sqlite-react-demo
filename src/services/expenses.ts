import type {
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from '../models/expense.model';
import { databaseService } from './database';

interface ExpenseRow {
  id: number;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    expenseDate: row.expenseDate,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeNotes(notes?: string | null): string | null {
  const trimmed = notes?.trim();
  return trimmed ? trimmed : null;
}

export async function getAllExpenses(): Promise<Expense[]> {
  const rows = await databaseService.query<ExpenseRow>(
    'SELECT id, title, category, amount, expenseDate, notes, createdAt, updatedAt FROM expenses ORDER BY expenseDate DESC, createdAt DESC',
  );
  return rows.map(toExpense);
}

export async function getExpenseById(id: number): Promise<Expense | null> {
  const rows = await databaseService.query<ExpenseRow>(
    'SELECT id, title, category, amount, expenseDate, notes, createdAt, updatedAt FROM expenses WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] ? toExpense(rows[0]) : null;
}

export async function createExpense(input: CreateExpenseInput): Promise<void> {
  const now = new Date().toISOString();
  await databaseService.execute(
    'INSERT INTO expenses (title, category, amount, expenseDate, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      input.title.trim(),
      input.category.trim(),
      input.amount,
      input.expenseDate,
      normalizeNotes(input.notes),
      now,
      now,
    ],
  );
}

export async function updateExpense(
  id: number,
  input: UpdateExpenseInput,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await databaseService.execute(
    'UPDATE expenses SET title = ?, category = ?, amount = ?, expenseDate = ?, notes = ?, updatedAt = ? WHERE id = ?',
    [
      input.title.trim(),
      input.category.trim(),
      input.amount,
      input.expenseDate,
      normalizeNotes(input.notes),
      updatedAt,
      id,
    ],
  );
}

async function recordApplicationLog(
  expenseId: number,
  deletedAt: string,
): Promise<void> {
  await databaseService.execute(
    'INSERT INTO application_logs (expenseId, deletedAt) VALUES (?, ?)',
    [expenseId, deletedAt],
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const deletedAt = new Date().toISOString();
  await databaseService.beginTransaction();
  try {
    await recordApplicationLog(id, deletedAt);
    await databaseService.execute('DELETE FROM expenses WHERE id = ?', [id]);
    await databaseService.commitTransaction();
  } catch (error) {
    await databaseService.rollbackTransaction();
    throw error;
  }
}
