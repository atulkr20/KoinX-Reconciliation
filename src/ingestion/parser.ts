import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function parseCSV(filePath: string): Record<string, string>[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const rows = parse(fileContent, {
        columns: true, 
        skip_empty_lines: true,
        trim: true,
    });

    return rows as Record<string, string>[];

}