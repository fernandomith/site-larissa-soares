import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getInitialClinicState } from '@/lib/seed-data';
import { ClinicDatabaseState } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'clinic-db.json');

function readDatabase(): ClinicDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialClinicState();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as ClinicDatabaseState;
  } catch {
    return getInitialClinicState();
  }
}

function writeDatabase(state: ClinicDatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export async function GET() {
  const db = readDatabase();
  return NextResponse.json(db);
}

export async function PUT(request: NextRequest) {
  try {
    const nextState = (await request.json()) as ClinicDatabaseState;
    writeDatabase(nextState);
    return NextResponse.json({ ok: true, state: nextState });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Invalid payload' },
      { status: 400 }
    );
  }
}
