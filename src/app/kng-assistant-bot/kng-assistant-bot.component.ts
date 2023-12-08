import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CartService, ProductService, User } from 'kng2-core';

@Component({
  selector: 'kng-assistant-bot',
  templateUrl: './kng-assistant-bot.component.html',
  styleUrls: ['./kng-assistant-bot.component.scss']
})
export class KngAssistantBotComponent implements OnInit {

  @ViewChild('chatroom') chatroom: ElementRef;
  @Input() user:User

  messages = [];
  prompt:string;
  markdown:any;

  constructor(
    private $cart: CartService,
    private $products: ProductService,
    private $cdr: ChangeDetectorRef
  ) { 
    this.user = new User({
      displayName:'Anonymous'
    })
    this.prompt = "";
  }

  get displayName () {    
    return this.user.displayName;
  }

  ngOnInit() {
    import('markdown-it').then(module =>  {
      this.markdown = new module.default({
        html:true,
        breaks:true,
        typographer:true
      });  
    })
  }

  async onChat() {
    const query = this.prompt;
    const assistant = {
      user:'James',
      content:'',
      html:'',
      assistant:true,
      products: []
    }
    this.messages.push(assistant);
    this.chatroom.nativeElement.scrollTop = this.chatroom.nativeElement.scrollHeight;
    this.prompt = "";
    const result:any = await this.$cart.chat({q:query},(text,data)=> {
      assistant.content+=text;
      assistant.assistant = false;
      assistant.html = this.markdown.render(assistant.content);
      this.$cdr.markForCheck();
      this.chatroom.nativeElement.scrollTop = this.chatroom.nativeElement.scrollHeight;

    });
    //
    // result.function =='list_of_products'
    const skus = result.data ||[];
    if(!skus.length) {
      return;
    }
    assistant.products = await this.$products.select({skus}).toPromise();
    assistant.products = assistant.products.sort((a,b) => a.title.localeCompare(b.title))
    this.$cdr.markForCheck();

  }

}
