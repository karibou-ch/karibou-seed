import { AfterContentChecked, Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[kng-autosize]'
})
export class KngTextfieldAutosizeDirective implements AfterContentChecked {
  textarea;

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
    style.overflow = 'hidden';
    style.height = 'auto';

    const height = this.textarea.scrollHeight;
    style.height = `${height}px`;
  }

}