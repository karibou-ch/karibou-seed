import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { User, UserService } from 'kng2-core';
import { ActivatedRoute } from '@angular/router';
import { i18n } from '../../common';
import { MdcSnackbar } from '@angular-mdc/web';

@Component({
  selector: 'kng-user-reminder',
  templateUrl: './kng-user-reminder.component.html',
  styleUrls: ['./kng-user-reminder.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngUserReminderComponent implements OnInit {

  @Input() user: User;

  locale: string;
  show: boolean;


  //
  // i18n

  i18n: any = {
    fr: {
      title: 'Nous pouvons vous envoyer un mail de rappel afin de vous aider dans l\'organisation de vos courses',
      super: 'Pratique!',
      title_time: 'A quelle heure souhaitez vous recevoir la notification',
      title_day: 'A quelles moments souhaitez vous recevoir la notification?'
    },
    en: {
      title: 'We can send you a reminder email to help you organize your shopping',
      super: 'Awesome!',
      title_time: 'At what time do you want to receive notification?',
      title_day: 'Which days?'
    }
  };

  times = [
    {value: '8', label: '8h00'},
    {value: '10', label: '10h00'},
    {value: '11', label: '11h00'},
    {value: '14', label: '14h00'},
    {value: '16', label: '16h00'},
    {value: '20', label: '20h00'}
  ];
  weekdays = [
    {value: '1', label: 'Lundi'},
    {value: '2', label: 'Mardi'},
    {value: '3', label: 'Mercredi'},
    {value: '4', label: 'Jeudi'},
    {value: '5', label: 'Vendredi'},
    {value: '6', label: 'Samedi'},
    {value: '0', label: 'Dimanche'}
  ];


  constructor(
    public  $i18n: i18n,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $snack: MdcSnackbar
  ) {
    const loader = this.$route.snapshot.parent.data['loader'] || this.$route.snapshot.data['loader'];
    if (loader.length) {
      this.user = this.user || loader[1];
    }
  }

  doUpdate(event, day: number, time?) {
    // FIXME change envent called 2x!
    // console.log('MdcCheckboxChange',event.type)
    if (!event.type) {
      return;
    }

    if (day) {
      day = day | 0;
      let pos = this.user.reminder.weekdays.indexOf(day);
      if (pos === -1) {
        this.user.reminder.weekdays.push(day);
      } else {
        do {
          this.user.reminder.weekdays.splice(pos, 1);
          pos = this.user.reminder.weekdays.indexOf(day);
        }while (pos > -1);

      }
    }
    if (time) {
      time = time | 0;
      this.user.reminder.time = time;
    }
    this.user.reminder.active = !!(this.user.reminder.weekdays.length);
  }

  ngOnInit() {
    this.locale = this.$i18n.locale;
  }

  isChecked(day: number) {
    return (this.user.reminder.weekdays || []).indexOf((day|0)) > -1;
  }


  save() {
    this.$user.save(this.user).subscribe(
      user => {
        this.$snack.open(this.$i18n.label().save_ok, this.$i18n.label().thanks, this.$i18n.snackOpt);
      },
      (hang) => this.$snack.open(hang.error, this.$i18n.label().thanks, this.$i18n.snackOpt)
    );
  }
}
