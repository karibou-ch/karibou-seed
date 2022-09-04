import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { i18n, KngNavigationStateService } from '../common';


@Component({
  selector: 'kng-search-bar',
  templateUrl: './kng-search-bar.component.html',
  styleUrls: ['./kng-search-bar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngSearchBarComponent implements OnInit {

  //
  // @ContentChild vs @ViewChild
  // https://stackoverflow.com/a/34327754/680373
 
  @ViewChild('search', { static: true }) search: ElementRef;
  @ViewChild('stats', { static: true }) stats: ElementRef;

  //
  // avoid double search
  searchLastValue: string;



  @HostBinding('class.search-desktop') appbar = true;
  @HostBinding('style.z-index') isOpen = 'auto';

  //
  // bind submit search form
  @HostListener('submit', ['$event']) onClick($event: Event) {
    const value = this.search.nativeElement.value;
    this.$navigation.searchAction(value);
    $event.stopPropagation();
    return false;
  }

  constructor(
    public $i18n: i18n,
    public $navigation: KngNavigationStateService
  ) { 
    this.$navigation.search$().subscribe((keyword)=>{
      if(keyword == 'clear'||keyword == 'favoris') {
        this.search.nativeElement.value = '';
        this.stats.nativeElement.innerText = '';
        this.searchLastValue = null;
        return;
      }
      if(keyword.indexOf('stats:')>-1) {
        this.doStats(keyword.split(':')[1]);
        return;
      }

      this.search.nativeElement.value = keyword;
    });

  }


  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.$i18n.label();
  }

  get isCleared() {
    return (!this.searchLastValue || this.searchLastValue=='')
  }


  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  doFavorite(){
    this.$navigation.searchAction('favoris');
  }

  doInput(value?: string) {
    value = value || this.search.nativeElement.value;
    if(this.searchLastValue == value) {
      return;
    }
    this.searchLastValue = value;
    this.$navigation.searchAction(value);
  }

  doStats(count){
    const margin = (this.search.nativeElement.value || '').length * 10;

    //
    // async clear?
    this.stats.nativeElement.style.marginLeft = 45 + margin + 'px';
    if (!this.search.nativeElement.value) {
      this.stats.nativeElement.innerText = '';
      return;
    }
    this.stats.nativeElement.innerText = '(' + count + ')';
  }

  onFocus() {
    try {
      this.search.nativeElement.select();
    } catch (e) {}
  }

  doClear() {
    this.$navigation.searchAction('clear');
  }


}



@Component({
  selector: 'kng-search',
  templateUrl: './kng-search.component.html',
  styleUrls: ['./kng-search-bar.component.scss']
})
export class KngSearchComponent extends KngSearchBarComponent implements OnInit {

  @HostBinding('class') mobile = 'search-mobile';

  ngOnInit(): void {
    
  }
}