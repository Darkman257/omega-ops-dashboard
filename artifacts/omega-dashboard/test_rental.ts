import { convertXlsxToCsv } from './scripts/xlsx-to-csv.ts';
import * as fs from 'fs';
convertXlsxToCsv("./data/حصر سيارات ايجار مشروع دبي.xlsx", "./data/temp-rental.csv");
const data = fs.readFileSync("./data/temp-rental.csv", "utf-8");
console.log(data.split('\n').slice(0, 30).join('\n'));
