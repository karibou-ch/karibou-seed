import {Directive, ElementRef, HostListener, Input, Renderer2, OnDestroy} from '@angular/core';

@Directive({
  selector: '[kng-ripple]',
  host:{
    '[class.kng-ripple-end]': 'terminate',
  }

})
export class KngRippleDirective implements OnDestroy {

  hostEl;

  constructor(private renderer: Renderer2, el: ElementRef) {
    this.hostEl = el.nativeElement;
  }

  @Input() terminate:boolean;

  ngOnDestroy() {
  }

  @HostListener('click', ['$event']) onClick(e: MouseEvent) {


    let ink, d, x, y;
    ink = this.hostEl.querySelector('.kng-ripple');

    if (ink == null) {
      ink = this.renderer.createElement('div');
      this.renderer.addClass(ink, 'kng-ripple');
      this.renderer.appendChild(this.hostEl, ink);
    }


    if (!ink.offsetHeight && !ink.offsetWidth) {
      d = Math.max(this.hostEl.offsetWidth, this.hostEl.offsetHeight);
      this.renderer.setStyle(ink, 'width', d + 'px');
      this.renderer.setStyle(ink, 'height', d + 'px');
    }

    x = this.hostEl.clientWidth/2;
    y = - this.hostEl.clientHeight + ink.clientHeight;


    this.renderer.setStyle(ink, 'margin-top', y + 'px');
    this.renderer.setStyle(ink, 'margin-left', x + 'px');
    ink.addEventListener("animationend", (event) => {
      this.renderer.removeClass(ink, 'kng-ripple');
      this.renderer.removeChild(this.hostEl, ink);

    });

    this.renderer.addClass(ink, 'kng-ripple-start');
  }


}
