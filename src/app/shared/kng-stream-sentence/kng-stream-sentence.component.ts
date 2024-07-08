import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'kng-stream-sentence',
  templateUrl: './kng-stream-sentence.component.html',
  styleUrls: ['./kng-stream-sentence.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngStreamSentenceComponent implements OnInit {

  @Output() chat = new EventEmitter<{ index, sentence }>();
  @Input() sentences: string[] = [];
  @Input() slideshow: number = 3000;
  @Input() pause;

  currentSentence = "";
  sentenceIndex = 0;
  displayAction: boolean = false;
  isRunning: boolean = true;

  constructor(
    private $cdr: ChangeDetectorRef
  ) {
    this.sentences = [];
  }

  get randomIndex() {
    const index = ((16 * Math.random()) | 0) % (this.sentences.length);
    return (index == this.sentenceIndex && this.sentences.length>1) ? this.randomIndex : (index);
    //return 2;
  }

  async ngOnDestory() {
    this.isRunning = false;
  }

  async ngOnInit() {
    while (this.isRunning) {
      while (this.pause && this.isRunning) {
        await this.time(1000);
      }
      if(this.sentences.length){
        this.sentenceIndex = this.randomIndex;
        await this.tokenstream(this.sentences[this.sentenceIndex]);  
      }
      await this.time(this.slideshow);
    }
  }

  async time(ttl) {
    return new Promise(res => {
      setTimeout(res, ttl || 0);
    });
  }

  tokenizeSentence(sentence: string, step: number = 3): string[] {
    const tokens: string[] = [];
    for (let i = 0; i < sentence.length; i += step) {
      tokens.push(sentence.substring(i, Math.min(i + step, sentence.length)));
    }
    return tokens;
  }

  async tokenstream(sentence: string) {
    this.displayAction = false;
    const tokens = this.tokenizeSentence(sentence);
    this.currentSentence = "";
    for (const token of tokens) {
      await this.time(60);
      this.currentSentence += token;
      this.$cdr.markForCheck();
    }
    this.displayAction = true;
    await this.time(500);

  }


  @HostListener('click', ['$event'])
  onClick() {
    const $event = {
      index: this.sentenceIndex,
      sentence: this.sentences[this.sentenceIndex]
    }
    this.pause = true
    this.chat.emit($event);
  }


}
