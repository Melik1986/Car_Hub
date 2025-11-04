import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(req: NextRequest) {
  const filePath = path.join(process.cwd(), 'server/data/cars.json');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const cars = JSON.parse(fileContents);

    const sp = req.nextUrl.searchParams;
    const limit = Number(sp.get('limit') ?? '10');
    const manufacturer = (sp.get('manufacturer') || '').toLowerCase();
    const model = (sp.get('model') || '').toLowerCase();
    const fuel = (sp.get('fuel') || '').toLowerCase();
    const yearStr = sp.get('year');

    const filtered = cars.filter((c: any) =>
      (!manufacturer || c.make?.toLowerCase().includes(manufacturer)) &&
      (!model || c.model?.toLowerCase().includes(model)) &&
      (!fuel || c.fuel_type?.toLowerCase() === fuel) &&
      (!yearStr || c.year === Number(yearStr))
    ).slice(0, limit);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error reading cars.json:', error);
    return NextResponse.json({ message: 'Error fetching car data' }, { status: 500 });
  }
}