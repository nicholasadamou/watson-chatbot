import { Injectable } from "@angular/core";
import * as Rx from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NotifyService {
  paneToggleEvent = new Rx.Subject();
  widgetDataEvent = new Rx.Subject();
  logoutEvent = new Rx.Subject();
  answerEvent = new Rx.Subject();
  scrollEvent = new Rx.Subject();

  subscribeToLogout(callback: any): void {
    this.logoutEvent.subscribe(callback);
  }

  subscribeToSend(callback: any): void {
    this.answerEvent.subscribe(callback);
  }

  subscribeToScroll(callback: any): void {
    this.scrollEvent.subscribe(callback);
  }

  logout(): void {
    this.logoutEvent.next();
  }

  send(value: string): void {
    this.answerEvent.next(value);
  }

  scroll(): void {
    this.scrollEvent.next();
  }

  constructor() {}
}
