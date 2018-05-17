import { Component, OnInit, Directive, HostBinding, Input } from '@angular/core';
import { LoaderService, Config, User, ConfigService } from 'kng2-core';

@Component({
  selector: 'kng-quick-editor',
  templateUrl: './quick-editor.component.html',
  styleUrls: ['./quick-editor.component.scss']
})
export class KngQuickEditorComponent implements OnInit {

  elems:any[];
  config:Config;
  user:User;
  display:boolean;

  constructor(
    private $loader:LoaderService,
    private $config:ConfigService
  ) { 
    this.user=new User();
    this.config=new Config();
    this.elems=[];
    this.display=false;
  }

  ngOnInit() {
    this.$loader.ready().subscribe(loader=>{
      Object.assign(this.config, loader[0]);
      Object.assign(this.user, loader[1]);
    });   

    this.$config.subscribe(
      (config:Config)=>{
        Object.assign(this.config, config);        
      }
    )
  }


  onEdit(){
    this.display=true;
    this.elems=Array.from(document.querySelectorAll('.kng-editor-key')).map(elem=>{
      return {key:elem.getAttribute('kng-editor-key'),value:elem.innerHTML};
    });
  }
}


@Directive({
  selector: '[kng-editor-key]'
})
export class KngEditorDirective {
  @Input('kng-editor-key') configKey:string;
  @HostBinding('class.kng-editor-key') isHost:boolean=true;

  ngAfterViewInit(): void {
    console.log('---- edit',this.configKey);
  }

}
