import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, map } from 'rxjs';
import { ApiResultFormat } from '../global';
import {
    CampaignHistoryItem,
    CampaignReport,
    CampaignStats,
    HistoryParams,
    Paginated,
} from './campaign-stats.model';

/** Formate une date en ISO ; absente = non envoyee. */
const isoOrNull = (value?: Date | null): string | null => (value ? value.toISOString() : null);

/**
 * Statistiques et historique des campagnes (API /message/history, /message/stats, /message/:id/report).
 */
@Injectable({ providedIn: 'root' })
export class CampaignStatsService {
    private readonly _url = `${environment.apiUrl}/message`;

    constructor(private _http: HttpClient) {}

    history(params: HistoryParams = {}): Observable<Paginated<CampaignHistoryItem>> {
        let httpParams = new HttpParams()
            .set('page', String(params.page ?? 1))
            .set('limit', String(params.limit ?? 20));
        if (params.from) httpParams = httpParams.set('from', isoOrNull(params.from)!);
        if (params.to) httpParams = httpParams.set('to', isoOrNull(params.to)!);
        if (params.status) httpParams = httpParams.set('status', params.status);
        if (params.channel) httpParams = httpParams.set('channel', params.channel);
        if (params.kind) httpParams = httpParams.set('kind', params.kind);
        if (params.q?.trim()) httpParams = httpParams.set('q', params.q.trim());
        return this._http
            .get<{ data: CampaignHistoryItem[]; total: number; page: number; limit: number; pages: number }>(`${this._url}/history`, { params: httpParams })
            .pipe(map((response) => ({ data: response.data, total: response.total, page: response.page, limit: response.limit, pages: response.pages })));
    }

    stats(from: Date, to: Date): Observable<CampaignStats> {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const params = new HttpParams()
            .set('from', from.toISOString())
            .set('to', to.toISOString())
            .set('timeZone', timeZone || 'Africa/Douala');
        return this._http
            .get<ApiResultFormat<CampaignStats>>(`${this._url}/stats`, { params })
            .pipe(map((response) => response.data));
    }

    report(messageId: string): Observable<CampaignReport> {
        return this._http
            .get<ApiResultFormat<CampaignReport>>(`${this._url}/${messageId}/report`)
            .pipe(map((response) => response.data));
    }

}
