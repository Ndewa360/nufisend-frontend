import { csvCell, toCsv } from './csv-export';

describe('csv-export', () => {
    it('escapes separators, quotes and line breaks', () => {
        expect(csvCell('a;b')).toBe('"a;b"');
        expect(csvCell('dit "oui"')).toBe('"dit ""oui"""');
        expect(csvCell('ligne\nsuivante')).toBe('"ligne\nsuivante"');
        expect(csvCell(null)).toBe('');
    });

    it('writes a BOM, a semicolon-separated header and one line per row', () => {
        const csv = toCsv(
            [{ title: 'Promo; juin', total: 12 }],
            [
                { key: 'title', label: 'Titre' },
                { key: 'total', label: 'Destinataires' },
            ],
        );
        expect(csv.startsWith('\uFEFF')).toBe(true);
        expect(csv.slice(1)).toBe('Titre;Destinataires\r\n"Promo; juin";12');
    });

    it('uses the column formatter when provided', () => {
        const csv = toCsv([{ rate: 0.5 }], [{ key: 'rate', label: 'Taux', format: (row) => `${row.rate * 100} %` }]);
        expect(csv.slice(1).split('\r\n')[1]).toBe('50 %');
    });
});
