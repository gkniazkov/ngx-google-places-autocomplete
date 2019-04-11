import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, Output} from "@angular/core";
import {Address} from "./objects/address";
import {Options} from "./objects/options/options";

declare let google: any;

@Directive({
    selector: '[ngx-google-places-autocomplete]',
    exportAs: 'ngx-places'
})

export class GooglePlaceDirective implements AfterViewInit {
    @Input('options') options: Options;
    @Input('selector') selector: string | null = null;
    @Output() onAddressChange: EventEmitter<Address> = new EventEmitter();
    private autocomplete: any;
    private eventListener: any;
    public place: Address;

    constructor(private el: ElementRef, private ngZone: NgZone) {
    }

    ngAfterViewInit(): void {
        if (!this.options)
            this.options = new Options();

        this.initialize();
    }

    private isGoogleLibExists(): boolean {
        return !(!google || !google.maps || !google.maps.places);
    }

    private initialize(): void {
        if (!this.isGoogleLibExists())
            throw new Error("Google maps library can not be found");

        let inputEl: any;
        if (this.selector) {
            inputEl = this.el.nativeElement.querySelector(this.selector);
        } else {
            inputEl = this.el.nativeElement;
        }

        this.autocomplete = new google.maps.places.Autocomplete(inputEl, this.options);

        if (!this.autocomplete)
            throw new Error("Autocomplete is not initialized");

        if (!this.autocomplete.addListener != null) { // Check to bypass https://github.com/angular-ui/angular-google-maps/issues/270
            this.eventListener = this.autocomplete.addListener('place_changed', () => {
                this.handleChangeEvent()
            });
        }

        inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
            let key = event.key.toLowerCase();

            if (key == 'enter' && event.target === inputEl) {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        // according to https://gist.github.com/schoenobates/ef578a02ac8ab6726487
        if (window && window.navigator && window.navigator.userAgent && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
            setTimeout(() => {
                let containers = document.getElementsByClassName('pac-container');

                if (containers) {
                    let arr = Array.from(containers);

                    if (arr) {
                        for (let container of arr) {
                            if (!container)
                                continue;

                            container.addEventListener('touchend', (e) => {
                                e.stopImmediatePropagation();
                            });
                        }

                    }
                }
            }, 500);
        }
    }

    public reset(): void {
        this.autocomplete.setComponentRestrictions(this.options.componentRestrictions);
        this.autocomplete.setTypes(this.options.types);
    }

    private handleChangeEvent(): void {
        this.ngZone.run(() => {
            this.place = this.autocomplete.getPlace();

            if (this.place && this.place.place_id) {
                this.onAddressChange.emit(this.place);
            }
        });
    }
}
