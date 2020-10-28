import { Component, OnInit, Renderer2 } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { AuthenticationService } from "./services/authentication.service";
import { ChatService } from "./services/chat.service";
import { NotifyService } from "./services/notify.service";
import { MatDialog } from "@angular/material/dialog";
import { Utils } from "./utils";
import { environment } from "../environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  env: any = environment;
  title: string = this.env.appName;

  widthSmall: number = 405;
  widthMedium: number = 600;

  stopListening: Function;

  constructor(
    public authService: AuthenticationService,
    public chatService: ChatService,
    public notifyService: NotifyService,
    public logoutDialog: MatDialog,
    private titleService: Title,
    private route: ActivatedRoute,
    private renderer: Renderer2
  ) {
    this.stopListening = renderer.listen(
      "window",
      "message",
      this.handleMessage.bind(this)
    );

    this.setTitle(this.title);
  }

  handleMessage(event: Event) {
    const message = event as MessageEvent;

    // Prevent the initial phantom call that Chrome sends.
    const e: any = message;
    if (e.data && e.data.data == undefined && e.data.type == "webpackOk") {
      return;
    }

    if (message.data) {
      this.chatService.askQuestion(
        message.data,
        () => {},
        false,
        true,
        false,
        true,
        true,
        false
      );
    }
  }

  ngOnDestroy() {
    this.stopListening();
  }

  ngOnInit(): void {
    // Failsafe to load photo if user is logged in and wasn't loaded previously for some reason.
    this.authService.loadPhoto();

    // Perform login flow on initial opening of the chat-bot if not authenticated.
    const isAuthenticated: boolean = this.authService.isAuthenticated();
    if (!isAuthenticated) {
      this.doLogin();
    }

    this.route.queryParams.subscribe((params) => {
      if (params["mode"] && params["mode"] == "embedded") {
        this.env.state.embeddedMode = true;
      }
      if (params["message"]) {
        this.chatService.askQuestion(
          params["message"],
          () => {},
          true,
          true,
          false,
          true,
          true,
          params["linkable"] != undefined
        );
      }
    });
  }

  isWidthMedium(): boolean {
    const w = this.getWidth();
    return w > this.widthSmall && w <= this.widthMedium;
  }

  isWidthSmall(): boolean {
    return this.getWidth() <= this.widthSmall;
  }

  getWidth(): number {
    return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );
  }

  getHeight(): number {
    return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );
  }

  setPage(page: string) {
    this.env.state.page = page;
  }

  showLogin(): boolean {
    return !this.authService.getEmail() && !this.env.server.isLocal;
  }

  doLogin(): void {
    this.authService.login();
    this.chatService.notifyAnswer();
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  openChat(): void {
    window.open(Utils.getServerUrl(), "_blank");
  }
}
