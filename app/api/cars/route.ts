import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(req: NextRequest) {
  const filePath = path.join(process.cwd(), 'server/data/cars.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const cars = JSON.parse(fileContents);
    return NextResponse.json(cars);
  } catch (error) {
    console.error('Error reading cars.json:', error);
    return NextResponse.json({ message: 'Error fetching car data' }, { status: 500 });
  }
}