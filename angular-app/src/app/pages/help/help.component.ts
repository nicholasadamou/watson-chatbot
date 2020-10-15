import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  helpHtml: any = environment.server.api['chat'].helpHtml;

  constructor() { }

  ngOnInit() {
  }
}
