import { AfterContentChecked, Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[kng-autosize]'
})
export class KngTextfieldAutosizeDirective implements AfterContentChecked {
  textarea;
  lastHeight;

  constructor(public element: ElementRef) {
  }

  @HostListener('input', ['$event.target'])
  public onInput() {
    this.resize();
  }

  @HostListener('click', ['$event.target'])
  public onClick() {
    this.resize();
  }
  
  public ngAfterContentChecked() {
   //this.resize();
  }

  public resize() {    

    //
    // init child control
    this.textarea=this.textarea||this.element.nativeElement.querySelector('textarea');
    const style = this.textarea.style||{};
    const height = this.textarea.scrollHeight;

    if((this.lastHeight+50)>height){
      return;
    }
    this.lastHeight=height;
    style.overflow = 'hidden';
    style.height = 'auto';

    style.height = `${height}px`;
  }

}