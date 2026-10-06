import { TZDate } from '@date-fns/tz';
const d = new TZDate('2026-10-06T19:00:00.000Z', 'America/Bogota');
console.log(d.getHours()); // should be 14

