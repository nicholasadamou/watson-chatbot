import { Injectable } from "@angular/core";
import * as Rx from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NotifyService {
  answerEvent = new Rx.Subject();
  scrollEvent = new Rx.Subject();

  subscribeToSend(callback: any): void {
    this.answerEvent.subscribe(callback);
  }

  subscribeToScroll(callback: any): void {
    this.scrollEvent.subscribe(callback);
  }

  send(value: string): void {
    this.answerEvent.next(value);
  }

  scroll(): void {
    this.scrollEvent.next();
  }

  constructor() {}
}
