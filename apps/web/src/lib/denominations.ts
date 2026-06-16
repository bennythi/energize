export interface Denomination {
  cents: number;
  label: string;
  type: 'note' | 'coin';
}

export const DENOMINATIONS: Denomination[] = [
  { cents: 50000, label: '500 €', type: 'note' },
  { cents: 20000, label: '200 €', type: 'note' },
  { cents: 10000, label: '100 €', type: 'note' },
  { cents: 5000, label: '50 €', type: 'note' },
  { cents: 2000, label: '20 €', type: 'note' },
  { cents: 1000, label: '10 €', type: 'note' },
  { cents: 500, label: '5 €', type: 'note' },
  { cents: 200, label: '2 €', type: 'coin' },
  { cents: 100, label: '1 €', type: 'coin' },
  { cents: 50, label: '50 ct', type: 'coin' },
  { cents: 20, label: '20 ct', type: 'coin' },
  { cents: 10, label: '10 ct', type: 'coin' },
  { cents: 5, label: '5 ct', type: 'coin' },
  { cents: 2, label: '2 ct', type: 'coin' },
  { cents: 1, label: '1 ct', type: 'coin' },
];

export function totalCents(counts: Record<number, number>): number {
  return DENOMINATIONS.reduce((sum, d) => sum + (counts[d.cents] ?? 0) * d.cents, 0);
}
