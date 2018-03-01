import { Directive, AfterViewInit, ElementRef, Input, OnDestroy, Renderer } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/exhaustMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/startWith';

interface ScrollPosition {
  sH: number;
  sT: number;
  cH: number;
};

const DEFAULT_SCROLL_POSITION: ScrollPosition = {
  sH: 0,
  sT: 0,
  cH: 0
};

//
// this is a simple infinite scroll 
// https://codeburst.io/angular-2-simple-infinite-scroller-directive-with-rxjs-observables-a989b12d4fb1

@Directive({
  selector: '[infiniteScroller]'
})
export class InfiniteScrollerDirective implements AfterViewInit, OnDestroy {

  private scrollEvent$;

  private userScrolledDown$;

  private requestStream$;

  private requestOnScroll$;

  //
  // scrollCallback — callback function which should 
  // return an observable
  @Input()
  scrollCallback;

  // immediateCallback — a boolean value, if true as soon 
  // as the directive is initialized call the callback()
  @Input()
  immediateCallback;

  // scrollPercent — until what percentage the user should 
  // scroll the container for the scrollCallback to be called  
  @Input()
  scrollPercent = 70;

  @Input()
  infiniteScrollContainer;

  constructor(private renderer : Renderer,private elm: ElementRef) { 

  }

  ngAfterViewInit() {
    this.registerScrollEvent();
    this.streamScrollEvents();
    this.requestCallbackOnScroll();
  }

  ngOnDestroy(){
    //clean only if needed!
    //this.requestOnScroll$.unsubscribe()
  }

  private registerScrollEvent() {
    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    let elem=this.elm.nativeElement;
    if(this.infiniteScrollContainer){
      elem=document.querySelector(this.infiniteScrollContainer)
      // this.renderer.listenGlobal("document.body", "scroll", (e) => console.log("body event",e));
      elem=elem||window;
    }
    this.scrollEvent$ = Observable.fromEvent(elem, 'scroll');
  }

  private streamScrollEvents() {
    this.userScrolledDown$ = this.scrollEvent$
      .map((e: any): ScrollPosition => ({
        sH: e.target.scrollingElement.scrollHeight,
        sT: e.target.scrollingElement.scrollTop,
        cH: e.target.scrollingElement.clientHeight
      }))
      .pairwise()
      .filter(positions => this.isUserScrollingDown(positions) && this.isScrollExpectedPercent(positions[1]))
  }

  private requestCallbackOnScroll() {

    this.requestOnScroll$ = this.userScrolledDown$;

    if (this.immediateCallback) {
      this.requestOnScroll$ = this.requestOnScroll$
        .startWith([DEFAULT_SCROLL_POSITION, DEFAULT_SCROLL_POSITION]);
    }

    this.requestOnScroll$
      .exhaustMap(() => { return this.scrollCallback(); })
      .subscribe(() => { });

  }

  private isUserScrollingDown = (positions) => {
    return positions[0].sT < positions[1].sT;
  }

  private isScrollExpectedPercent = (position) => {
    return ((position.sT + position.cH) / position.sH) > (this.scrollPercent / 100);
  }

}