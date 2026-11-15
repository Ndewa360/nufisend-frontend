import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CampaignStatsService } from './campaign-stats.service';

describe('CampaignStatsService', () => {
    let service: CampaignStatsService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        service = TestBed.inject(CampaignStatsService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('sends the history filters and maps the paginated response', () => {
        let received: any;
        service
            .history({ status: 'sent', channel: 'cloud', kind: 'scheduled', q: '  promo  ', page: 2, limit: 10 })
            .subscribe((response) => (received = response));

        const request = http.expectOne((req) => req.url.endsWith('/message/history'));
        expect(request.request.params.get('status')).toBe('sent');
        expect(request.request.params.get('channel')).toBe('cloud');
        expect(request.request.params.get('kind')).toBe('scheduled');
        expect(request.request.params.get('q')).toBe('promo');
        expect(request.request.params.get('page')).toBe('2');
        request.flush({ statusCode: 200, message: '', data: [{ _id: 'm1' }], total: 11, page: 2, limit: 10, pages: 2 });

        expect(received).toEqual({ data: [{ _id: 'm1' }], total: 11, page: 2, limit: 10, pages: 2 });
    });

    it('omits the empty filters from the history request', () => {
        service.history({}).subscribe();
        const request = http.expectOne((req) => req.url.endsWith('/message/history'));
        expect(request.request.params.has('status')).toBe(false);
        expect(request.request.params.has('channel')).toBe(false);
        expect(request.request.params.has('q')).toBe(false);
        request.flush({ statusCode: 200, message: '', data: [], total: 0, page: 1, limit: 20, pages: 0 });
    });

    it('unwraps the statistics response and sends the period', () => {
        const from = new Date('2026-11-01T00:00:00Z');
        const to = new Date('2026-11-30T00:00:00Z');
        let stats: any;
        service.stats(from, to).subscribe((value) => (stats = value));

        const request = http.expectOne((req) => req.url.endsWith('/message/stats'));
        expect(request.request.params.get('from')).toBe(from.toISOString());
        expect(request.request.params.get('to')).toBe(to.toISOString());
        request.flush({ statusCode: 200, message: '', data: { totals: { total: 3 }, byDay: [] } });

        expect(stats).toEqual({ totals: { total: 3 }, byDay: [] });
    });

    it('fetches a campaign report by id', () => {
        let report: any;
        service.report('abc123').subscribe((value) => (report = value));
        const request = http.expectOne((req) => req.url.endsWith('/message/abc123/report'));
        request.flush({ statusCode: 200, message: '', data: { title: 'Promo' } });
        expect(report).toEqual({ title: 'Promo' });
    });
});
