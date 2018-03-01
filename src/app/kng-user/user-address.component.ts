import { Component, Input } from '@angular/core';

import { LoaderService, 
         User, 
         UserAddress, 
         UserService } from 'kng2-core';

@Component({
  selector: 'kng-address',
  templateUrl: './user-address.component.html',
  styleUrls: ['./user-address.component.scss']
})
export class AddressComponent {

  @Input() address: UserAddress;

}
