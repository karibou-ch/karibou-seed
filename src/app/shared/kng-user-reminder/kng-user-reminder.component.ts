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

  @Input() hideTitle: boolean;
  @Input() user: User;

  locale: string;
  show: boolean;
  //
  // i18n

  i18n: any = {
    fr: {
      title: `Psst: C'est facile de préparez votre commande depuis votre téléphone!`,
      super: 'Pratique! ',
      info: `Vous avez peut être une préférence pour la livraison ? Avant la livraison,
             nous vous envoyons une notification par mail pour finaliser votre commande.`,
    },
    en: {
      title: `Psst: It's easy to prepare your order with your phone!`,
      super: 'Awesome! ',
      info: `Do you have a delivery preference? Before delivery, we send you a notification by email to finalize your order`,
    }
  };

  selectedNotification: any;
  time: any = 10; // hour to send notification


  times = [
    {value: '8', label: '8h00'},
    {value: '10', label: '10h00'},
    {value: '11', label: '11h00'},
    {value: '14', label: '14h00'},
    {value: '16', label: '16h00'},
    {value: '20', label: '20h00'}
  ];

  weekdays = [
    {value: '2', label: 'Mardi', icon: 'alarm'},
    {value: '5', label: 'Vendredi', icon: 'alarm'},
    {value: '-1', label: 'Sans notification'}
  ];


  constructor(
    public  $i18n: i18n,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $snack: MdcSnackbar
  ) {
    const loader = this.$route.snapshot.parent.data['loader'] || this.$route.snapshot.data['loader'];
    this.selectedNotification = this.weekdays[this.weekdays.length - 1];
    if (loader.length) {
      this.user = this.user || loader[1];
      this.selectedNotification = this.user.reminder.weekdays[0] > -1 ? this.user.reminder.weekdays[0] : -1;
    }
<<<<<<< HEAD
  }

  doUpdate(event, day: number, time?) {
    // FIXME change envent called 2x!
    // console.log('MdcCheckboxChange',event.type)
    if (!event.type) {
      return;
    }

    if (day) {
      // TOCHECK Forbidden bitwise operation (no-bitwise)
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
       // TOCHECK Forbidden bitwise operation (no-bitwise)
      time = time | 0;
      this.user.reminder.time = time;
=======
   }

  doUpdate(event) {
    let day = event.value.value;

    if (day && event.value.selected) {
       day = day | 0;
      this.user.reminder.weekdays = (day > -1) ? [day] : [];
      this.user.reminder.time = this.time;
    } else {
      this.user.reminder.weekdays = [];
      this.user.reminder.time = null;
>>>>>>> master
    }
    this.user.reminder.active = !!(this.user.reminder.weekdays.length);
    this.selectedNotification = this.weekdays[this.weekdays.length - 1];
    this.save();
  }

  ngOnInit() {
    this.locale = this.$i18n.locale;
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
