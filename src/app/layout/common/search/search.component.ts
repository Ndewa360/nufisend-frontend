import { Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations/public-api';
import { SearchResultSet, SearchService } from 'app/layout/common/search/search.service';

@Component({
    selector     : 'search',
    templateUrl  : './search.component.html',
    encapsulation: ViewEncapsulation.None,
    exportAs     : 'fuseSearch',
    animations   : fuseAnimations
})
export class SearchComponent implements OnChanges, OnInit, OnDestroy
{
    @Input() appearance: 'basic' | 'bar' = 'basic';
    @Input() debounce: number = 300;
    @Input() minLength: number = 2;
    @Output() search: EventEmitter<SearchResultSet[]> = new EventEmitter<SearchResultSet[]>();

    opened: boolean = false;
    resultSets: SearchResultSet[];
    searchControl: UntypedFormControl = new UntypedFormControl();
    private _matAutocomplete: MatAutocomplete;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _elementRef: ElementRef,
        private _renderer2: Renderer2,
        private _searchService: SearchService
    )
    {
    }

    @HostBinding('class') get classList(): any
    {
        return {
            'search-appearance-bar'  : this.appearance === 'bar',
            'search-appearance-basic': this.appearance === 'basic',
            'search-opened'          : this.opened
        };
    }

    @ViewChild('barSearchInput')
    set barSearchInput(value: ElementRef)
    {
        if ( value )
        {
            setTimeout(() => {
                value.nativeElement.focus();
            });
        }
    }

    @ViewChild('matAutocomplete')
    set matAutocomplete(value: MatAutocomplete)
    {
        this._matAutocomplete = value;
    }

    ngOnChanges(changes: SimpleChanges): void
    {
        if ( 'appearance' in changes )
        {
            this.close();
        }
    }

    ngOnInit(): void
    {
        this.searchControl.valueChanges
            .pipe(
                debounceTime(this.debounce),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((value) => {
                const query = typeof value === 'string' ? value.trim() : '';

                if ( !query || query.length < this.minLength )
                {
                    this.resultSets = null;
                    this.search.next([]);
                    return;
                }

                const resultSets = this._searchService.search(query);
                this.resultSets = resultSets;
                this.search.next(resultSets);
            });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onKeydown(event: KeyboardEvent): void
    {
        if ( event.code === 'Escape' )
        {
            if ( this.appearance === 'bar' && !this._matAutocomplete.isOpen )
            {
                this.close();
            }
        }
    }

    open(): void
    {
        if ( this.opened ) return;
        this.opened = true;
    }

    close(): void
    {
        if ( !this.opened ) return;
        this.searchControl.setValue('');
        this.opened = false;
    }

    onResultClick(): void
    {
        if ( this.appearance === 'bar' )
        {
            this.close();
        }
    }

    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
