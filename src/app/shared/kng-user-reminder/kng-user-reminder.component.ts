import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { User, UserService } from 'kng2-core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'kng-user-reminder',
  templateUrl: './kng-user-reminder.component.html',
  styleUrls: ['./kng-user-reminder.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngUserReminderComponent implements OnInit {

  @Input() user:User;

  show:boolean;

  times=[
    {value:'8',label:'8h00'},
    {value:'10',label:'10h00'},
    {value:'11',label:'11h00'},
    {value:'14',label:'14h00'},
    {value:'16',label:'16h00'},
    {value:'20',label:'20h00'}
  ];
  weekdays=[
    {value:'1',label:'Lundi'},
    {value:'2',label:'Mardi'},
    {value:'3',label:'Mercredi'},
    {value:'4',label:'Jeudi'},
    {value:'5',label:'Vendredi'},
    {value:'6',label:'Samedi'},
    {value:'0',label:'Dimanche'}
  ]


  constructor(
    private $user:UserService,
    private $route: ActivatedRoute
  ) { 
    let loader=this.$route.snapshot.parent.data['loader']||this.$route.snapshot.data['loader'];
    if(loader.length){
      this.user=this.user||loader[1];
    }
  }

  doUpdate(){
    this.$user.save(this.user).subscribe();
  }

  ngOnInit() {
  }

  isChecked(day:number){
    return (this.user.reminder.weekdays||[]).indexOf(day|0)>-1;
  }
}
