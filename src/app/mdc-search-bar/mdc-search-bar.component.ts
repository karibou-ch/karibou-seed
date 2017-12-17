import { 
  Component,
  ElementRef, 
  HostBinding,
  HostListener,
  OnInit,
  ViewChild 
} from '@angular/core';


@Component({
  selector: 'mdc-toolbar-section[mdc-search-bar],mdc-search-bar',
  templateUrl: './mdc-search-bar.component.html',
  styleUrls: ['./mdc-search-bar.component.scss']
})
export class MdcSearchBarComponent implements OnInit {

  constructor() { }

  //
  // @ContentChild vs @ViewChild
  // https://stackoverflow.com/a/34327754/680373
  @ViewChild('form') form: ElementRef;

  @HostBinding('class.mat-search--desktop') isHostClass=true;
  @HostListener('submit', ['$event']) onclick($event: Event) {
    console.log('----------- onsubmit',$event)
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  //
  // .mat-toolbar--open-search
  onOpenSearch(){
		// document.querySelector('.mat-toolbar--search').style = "visibility: visible; overflow: hidden; --mat-toolbar--search-location: " + (document.body.clientWidth - searchIcon.offsetLeft - 20) + "px;";
		// document.querySelector('.mat-toolbar--search-container').style = "animation: mat-toolbar--open-search 0.7s forwards; -webkit-transform: translateZ(0);";
		// document.querySelector('.mat-toolbar--search-text').focus();
		// if(document.querySelector('.mat-toolbar__row--tab-bar')){
		// 	document.querySelector('.mat-toolbar__row--tab-bar').classList.add('mat-margin-animation');
		// 	if(document.querySelector('.mat-toolbar-adjust')){document.querySelector('.mat-toolbar-adjust').classList.add('mat-margin-animation')};
		// 	setTimeout(function() {
		// 		document.querySelector('.mat-toolbar__row--tab-bar').style.cssText += "display: none";
		// 	}, 300);
		// }    
  }

  //
  // .mat-toolbar--exit-search
  onExitSearch(){
		// document.querySelector('.mat-toolbar--search-container').style = "animation: mat-toolbar--close-search 0.5s forwards; -webkit-transform: translateZ(0);";
		// setTimeout(function() {document.querySelector('.mat-toolbar--search').style = "visibility: hidden; --mat-toolbar--search-location: " + (document.body.clientWidth - searchIcon.offsetLeft - 20) + "px;";}, 500);
		// document.querySelector('.mat-toolbar--search-text').value = '';
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
  onClearSearchQuery(){
		// document.querySelector('.mat-toolbar--search-text').value = '';
		// document.querySelector('.mat-toolbar--search-text').focus();    
  }


}
