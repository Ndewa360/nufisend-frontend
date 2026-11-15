/** Colonne d'un export CSV. */
export interface CsvColumn<T> {
    key: keyof T | string;
    label: string;
    format?: (row: T) => string | number | null | undefined;
}

/** Echappe une cellule : guillemets doubles, separateur ou retour a la ligne entre guillemets. */
export const csvCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * CSV compatible Excel (francais) : separateur point-virgule, BOM UTF-8, fin de ligne CRLF.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
    const header = columns.map((column) => csvCell(column.label)).join(';');
    const body = rows.map((row) =>
        columns
            .map((column) => csvCell(column.format ? column.format(row) : (row as any)[column.key as string]))
            .join(';'),
    );
    return '\uFEFF' + [header, ...body].join('\r\n');
}

/** Telecharge le contenu dans le navigateur. */
export function downloadCsv(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
