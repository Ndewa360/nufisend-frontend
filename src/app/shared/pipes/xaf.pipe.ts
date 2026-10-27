import { formatNumber } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

/** Montant en francs CFA : `1440 | xaf` -> `1 440 FCFA`. */
@Pipe({ name: 'xaf', standalone: true })
export class XafPipe implements PipeTransform
{
    transform(value: number | null | undefined, withUnit = true): string
    {
        const amount = formatNumber(Number(value) || 0, 'fr', '1.0-2');
        return withUnit ? `${amount} FCFA` : amount;
    }
}
