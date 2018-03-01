import { Component, Input } from '@angular/core';
import { LoaderService, 
         User, 
         UserCard, 
         UserService } from 'kng2-core';

@Component({
  selector: 'kng-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})

export class CardComponent {

  @Input() card: UserCard[];

}
