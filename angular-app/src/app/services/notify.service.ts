import { Injectable } from "@angular/core";
import * as Rx from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NotifyService {
  answerEvent = new Rx.Subject();

  subscribeToSend(callback: any): void {
    this.answerEvent.subscribe(callback);
  }

  send(value: string): void {
    this.answerEvent.next(value);
  }

  constructor() {}
}
