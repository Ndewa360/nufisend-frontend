import { Component, ElementRef, HostBinding, Input, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations/public-api';
import { SearchResult, SearchResultSet, SearchService } from './search.service';

@Component({
    selector     : 'search',
    templateUrl  : './search.component.html',
    encapsulation: ViewEncapsulation.None,
    exportAs     : 'fuseSearch',
    animations   : fuseAnimations
})
export class SearchComponent implements OnChanges, OnInit, OnDestroy {

    @Input() appearance: 'basic' | 'bar' = 'basic';
    @Input() debounce: number = 300;
    @Input() minLength: number = 2;

    opened = false;
    resultSets: SearchResultSet[] = [];
    searchControl = new UntypedFormControl();
    private _matAutocomplete: MatAutocomplete;
    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _elementRef: ElementRef,
        private _renderer2: Renderer2,
        private _searchService: SearchService,
        private _router: Router
    ) {}

    @HostBinding('class') get classList(): any {
        return {
            'search-appearance-bar'  : this.appearance === 'bar',
            'search-appearance-basic': this.appearance === 'basic',
            'search-opened'          : this.opened
        };
    }

    @ViewChild('barSearchInput')
    set barSearchInput(value: ElementRef) {
        if (value) setTimeout(() => value.nativeElement.focus());
    }

    @ViewChild('matAutocomplete')
    set matAutocomplete(value: MatAutocomplete) {
        this._matAutocomplete = value;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ('appearance' in changes) this.close();
    }

    ngOnInit(): void {
        this.searchControl.valueChanges
            .pipe(debounceTime(this.debounce), takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                const query = typeof value === 'string' ? value.trim() : '';
                if (!query || query.length < this.minLength) {
                    this.resultSets = [];
                    return;
                }
                this.resultSets = this._searchService.search(query);
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(undefined);
        this._unsubscribeAll.complete();
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.code === 'Escape' && this.appearance === 'bar' && !this._matAutocomplete?.isOpen) {
            this.close();
        }
    }

    open(): void {
        if (this.opened) return;
        this.opened = true;
    }

    close(): void {
        if (!this.opened) return;
        this.searchControl.setValue('');
        this.opened = false;
    }

    navigateTo(result: SearchResult): void {
        this._router.navigateByUrl(result.link);
        this.close();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
