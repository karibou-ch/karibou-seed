import { Directive, AfterViewInit, ElementRef, Input, OnDestroy, Renderer2 } from '@angular/core';

import { Observable, Subscription, fromEvent } from 'rxjs';
import { exhaustMap, filter, map, pairwise, startWith } from 'rxjs/operators';

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

  private subscription: Subscription;

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

  constructor(private renderer: Renderer2, private elm: ElementRef) {

  }

  ngAfterViewInit() {
    this.registerScrollEvent();
    this.streamScrollEvents();
    this.requestCallbackOnScroll();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private registerScrollEvent() {
    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    let elem = this.elm.nativeElement;
    if (this.infiniteScrollContainer) {
      //TODO get ElementRef from HTMLDivElement ??;
      //TODO get scroll from ElementRef
      //TODO scroll with rxjs6 https://www.bennadel.com/blog/3446-monitoring-document-and-element-scroll-percentages-using-rxjs-in-angular-6-0-2.htm
      // console.log('---container',this.infiniteScrollContainer,fromEvent(this.infiniteScrollContainer, 'scroll'));
      if (this.infiniteScrollContainer instanceof ElementRef) {
        elem = this.infiniteScrollContainer.nativeElement;
      } else {
        elem = document.querySelector(this.infiniteScrollContainer);
      }
      elem = elem || window;
    }
    this.scrollEvent$ = fromEvent(elem, 'scroll');
  }

  private streamScrollEvents() {
    this.userScrolledDown$ = this.scrollEvent$.pipe(
      map((e: any) => e.target.scrollingElement || e.target),
      map((target: any): ScrollPosition => ({
        sH: target.scrollHeight,
        sT: target.scrollTop,
        cH: target.clientHeight
      })),
      pairwise(),
      filter(positions => this.isUserScrollingDown(positions) && this.isScrollExpectedPercent(positions[1]))
    );
  }

  private requestCallbackOnScroll() {

    this.requestOnScroll$ = this.userScrolledDown$;

    if (this.immediateCallback) {
      this.requestOnScroll$ = this.requestOnScroll$.pipe(
        startWith([DEFAULT_SCROLL_POSITION, DEFAULT_SCROLL_POSITION])
      );
    }

    this.subscription = this.requestOnScroll$.pipe(
      exhaustMap(() => { return this.scrollCallback(); })
    ).subscribe(() => { });

  }

  private isUserScrollingDown = (positions) => {
    return positions[0].sT < positions[1].sT;
  }

  private isScrollExpectedPercent = (position) => {
    return ((position.sT + position.cH) / position.sH) > (this.scrollPercent / 100);
  }

}
