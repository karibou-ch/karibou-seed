import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { User } from 'kng2-core';

@Component({
  selector: 'kng-user-reminder',
  templateUrl: './kng-user-reminder.component.html',
  styleUrls: ['./kng-user-reminder.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngUserReminderComponent implements OnInit {

  @Input() user:User;

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


  constructor() { }

  ngOnInit() {
  }

  isChecked(day:number){
    return this.user.reminder.weekdays.indexOf(day)>-1;
  }
}
