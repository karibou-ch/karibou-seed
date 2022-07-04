import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'kng-search-bar',
  templateUrl: './kng-search-bar.component.html',
  styleUrls: ['./kng-search-bar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngSearchBarComponent implements OnInit {

  constructor() { }

  //
  // @ContentChild vs @ViewChild
  // https://stackoverflow.com/a/34327754/680373
 
  @ViewChild('search', { static: true }) search: ElementRef;
  @ViewChild('searchContainer', { static: true }) searchContainer: ElementRef;
  @ViewChild('searchText', { static: true }) searchText: ElementRef;

  //
  // Element doesnt access offsetLeft
  searchIcon: any;


  @HostBinding('class') isHostClass = 'mat-search--desktop  mat-toolbar--open-search primary';
  @HostBinding('style.z-index') isOpen = 'auto';

  //
  // bind submit search form
  @HostListener('submit', ['$event']) onClick($event: Event) {
    console.log('----------- onsubmit', $event);
  }


  ngOnInit() {
    // bind open search
    // document.querySelector('.mat-toolbar--open-search').addEventListener('click', this.onSearch.bind(this));

    // bind exit search
    // document.querySelector('.mat-toolbar--exit-search').addEventListener('click', this.onExitSearch.bind(this));

    // this.searchIcon = document.querySelector('.mat-toolbar--open-search');
  }

  ngAfterViewInit(): void {
  }

  //
  // on search
  onSearch() {
    this.isOpen = '1';
    //
    // document.querySelector('.mat-toolbar--search').style = "visibility: visible; overflow: hidden; --mat-toolbar--search-location: " + (document.body.clientWidth - 300 - 20) + "px;";
    this.search.nativeElement.style = 'visibility: visible; overflow: hidden; --mat-toolbar--search-location: ' + (document.body.clientWidth - this.searchIcon.offsetLeft - 20) + 'px;';
    // document.querySelector('.mat-toolbar--search-container').style = "animation: mat-toolbar--open-search 0.7s forwards; -webkit-transform: translateZ(0);";
    this.searchContainer.nativeElement.style = 'animation: mat-toolbar--open-search 0.7s forwards; -webkit-transform: translateZ(0);';
    // document.querySelector('.mat-toolbar--search-text').focus();
    this.searchText.nativeElement.focus();

    // if(document.querySelector('.mat-toolbar__row--tab-bar')){
    //   document.querySelector('.mat-toolbar__row--tab-bar').classList.add('mat-margin-animation');
    //   if(document.querySelector('.mat-toolbar-adjust')){document.querySelector('.mat-toolbar-adjust').classList.add('mat-margin-animation')};
    //   setTimeout(function() {
    //     document.querySelector('.mat-toolbar__row--tab-bar').style.cssText += "display: none";
    //   }, 300);
    // }
  }

  //
  // .mat-toolbar--exit-search
  onExitSearch() {
    this.isOpen = 'auto';

    // document.querySelector('.mat-toolbar--search-container').style = "animation: mat-toolbar--close-search 0.5s forwards; -webkit-transform: translateZ(0);";
    this.searchContainer.nativeElement.style = 'animation: mat-toolbar--close-search 0.5s forwards; -webkit-transform: translateZ(0);';
    // document.querySelector('.mat-toolbar--search-text').value = '';
    this.searchText.nativeElement.value = '';
    setTimeout(() => {
      // setTimeout(function() {document.querySelector('.mat-toolbar--search').style = "visibility: hidden; --mat-toolbar--search-location: " + (document.body.clientWidth - searchIcon.offsetLeft - 20) + "px;";}, 500);
      this.search.nativeElement.style = 'visibility: hidden; --mat-toolbar--search-location: ' + (document.body.clientWidth - this.searchIcon.offsetLeft - 20) + 'px;';

    }, 700);
		// if(document.querySelector('.mat-toolbar__row--tab-bar')){
		// 	document.querySelector('.mat-toolbar__row--tab-bar').style = "display: block;";
		// 	setTimeout(function() {
		// 		document.querySelector('.mat-toolbar__row--tab-bar').classList.remove('mat-margin-animation');
		// 		if(document.querySelector('.mat-toolbar-adjust')){document.querySelector('.mat-toolbar-adjust').classList.remove('mat-margin-animation')};
		// 	}, 100);
		// }

  }

  //
  // .clear-search-query
  onClearSearchQuery() {
    this.searchText.nativeElement.value = '';
    this.searchText.nativeElement.focus();
  }


}
