import { Injectable } from "@angular/core";
import * as Rx from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NotifyService {
  answerEvent = new Rx.Subject();
  sendEvent = new Rx.Subject();

  subscribeToAnswer(callback: any): void {
    this.answerEvent.subscribe(callback);
  }

  subscribeToSend(callback: any): void {
    this.sendEvent.subscribe(callback);
  }

  send(value: string): void {
    this.sendEvent.next(value);
  }

  notifyAnswer(): void {
    this.answerEvent.next();
  }

  notifySend(): void {
    this.sendEvent.next();
  }

  constructor() {}
}
