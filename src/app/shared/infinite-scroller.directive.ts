import { Directive, AfterViewInit, ElementRef, Input, OnDestroy } from '@angular/core';

import { Subscription, fromEvent } from 'rxjs';
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
  infiniteScrollContainer?: ElementRef | HTMLElement | string;

  constructor(private elm: ElementRef) {

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
    const elem = this.resolveScrollContainer();
    this.scrollEvent$ = fromEvent(elem, 'scroll');
  }

  private resolveScrollContainer(): HTMLElement | Window {
    const target = this.infiniteScrollContainer;
    if (!target) {
      return this.elm.nativeElement;
    }

    if (target instanceof ElementRef) {
      return target.nativeElement;
    }

    if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
      return target;
    }

    if (typeof target === 'string') {
      return document.querySelector(target) as HTMLElement || window;
    }

    return window;
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
