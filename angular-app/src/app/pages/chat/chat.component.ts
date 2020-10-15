import { Component, OnInit } from "@angular/core";
import { ChatService } from "../../services/chat.service";
import { NotifyService } from "../../services/notify.service";
import { AuthenticationService } from "../../services/authentication.service";
import { ConfigService } from "../../services/config.service";
import { MatDialog } from "@angular/material/dialog";
import { GenericDialogComponent } from "../../dialogs/generic-dialog/generic-dialog.component";
import {
  ImageDialogComponent,
  ImageDialogData,
} from "../../dialogs/image-dialog/image-dialog.component";
import { GenericTooltipComponent } from "../../dialogs/generic-tooltip/generic-tooltip.component";
import { Message } from "../../app.constants";
import { Utils } from "../../utils";
import {
  MessagePartSubMessage,
  MessagePartSubMessageType,
} from "../../app.constants";

import {
  MESSAGE_INTRODUCTION,
  MESSAGE_ENTER_QUESTION,
  MessageType,
} from "../../app.constants";
import { environment } from "../../../environments/environment";

//import { MessageType, MessagePartType, MessagePartSubMessageType } from '../../app.constants';

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent implements OnInit {
  env: any = environment;
  CONFIG: any = environment.config;
  CHAT: any = environment.server.api["chat"];

  constructor(
    public chatService: ChatService,
    public authService: AuthenticationService,
    public genericDialog: MatDialog,
    public imageDialog: MatDialog,
    public genericTooltip: GenericTooltipComponent,
    private configService: ConfigService,
    private notify: NotifyService
  ) {
    if (!this.CHAT) {
      this.CHAT = { assistantIds: {} };
    }
  }

  ngOnInit() {
    if (!environment.state.chatInitialized) {
      this.chatService.startNewHistory();

      this.chatService.addMessage({
        type: MessageType.BREAK,
        messages: [],
      });

      if (this.CONFIG.showIntroduction && !environment.state.embeddedMode) {
        MESSAGE_INTRODUCTION(
          environment.server.banner,
          this.CHAT.introStatements,
          this.chatService,
          () => {
            // environment.config.showIntroduction = false;
            this.configService.saveConfig();
            this.showStartMessages();
          }
        );
      } else {
        this.showStartMessages();
      }
    }

    /* TESTING

    this.chatService.addMessage({
      type: MessageType.WATSON,
      messages: [{
        type: MessagePartType.NORMAL,
        message: "This is the test message",
        submessages: [{
          message: "",
          type: MessagePartSubMessageType.IMAGE,
          image: "http://w3-pics.ibm.com/bluepages/photo/Photo.jsp?email=mwanders@us.ibm.com",
        },{
          message: "",
          type: MessagePartSubMessageType.IMAGE,
          image: "http://w3-pics.ibm.com/bluepages/photo/Photo.jsp?email=mwanders@us.ibm.com",
        }]
      }]
    });

    this.chatService.addMessage({
      type: MessageType.USER,
      messages: [{
        type: MessagePartType.HIGHLIGHT,
        message: "This is the test message",
        submessages: [{
          message: "",
          type: MessagePartSubMessageType.IMAGE,
          image: "http://w3-pics.ibm.com/bluepages/photo/Photo.jsp?email=mwanders@us.ibm.com",
        },{
          message: "",
          type: MessagePartSubMessageType.IMAGE,
          image: "http://w3-pics.ibm.com/bluepages/photo/Photo.jsp?email=mwanders@us.ibm.com",
        }]
      }]
    });

    this.chatService.addMessage({
      type: MessageType.WATSON,
      messages: [{
        type: MessagePartType.NORMAL,
        message: "This is the test message",
        submessages: [{
          type: MessagePartSubMessageType.METADATA,
          message: "This is a sub message 1",
          metadata: {
            title: "Department Details",
            desc: "12345",
            keys: ['deptName', 'deptDesc'],
            deptName: {
              title: 'Department Name',
              value: 'This is the department name.'
            },
            deptDesc: {
              title: 'Department Description',
              value: 'This is the department description.'
            }
          }
        },{
          type: MessagePartSubMessageType.STRING,
          message: "This is a sub message 2"
        }]
      }]
    });

    this.chatService.addMessage({
      type: MessageType.USER,
      messages: [{
        type: MessagePartType.NORMAL,
        message: "This is the test message",
        submessages: [{
          type: MessagePartSubMessageType.STRING,
          message: "This is a sub message 1"
        },{
          type: MessagePartSubMessageType.STRING,
          message: "This is a sub message 2"
        }]
      }]
    });
    */

    environment.state.chatInitialized = true;
  }

  showStartMessages(): void {
    if (!this.env.state.embeddedMode) {
      this.chatService.addMessage(
        MESSAGE_ENTER_QUESTION(this.authService.isAuthenticated()),
        true
      );

      if (this.CHAT.startStatements && this.CHAT.startStatements.length > 0) {
        let methods = new Array(this.CHAT.startStatements.length);

        for (let i = 0; i < this.CHAT.startStatements.length; i++) {
          methods[i] = (data) => {
            let promise = new Promise((resolve, reject) => {
              setTimeout(() => {
                this.chatService.askQuestion(
                  this.CHAT.startStatements[i],
                  () => {
                    resolve({});
                  },
                  true,
                  true,
                  true,
                  true,
                  true,
                  i == 0
                );
              }, 100);
            });
            return promise;
          };
        }

        let p = methods[0]({});
        for (let i = 1; i < methods.length; i++) {
          p = p.then(methods[i]);
        }
      }
    }
  }

  getMessageTimestamp(msg: Message) {
    return new Date(msg.timestamp).toLocaleString("en-US");
  }

  openImageDialog(event: any, src: string, message?: string): void {
    const dialogData: ImageDialogData = {
      src: src,
      message: message ? message : "Image",
    };

    const dialogRef = this.imageDialog.open(ImageDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(/*accepted*/ () => {});
  }

  optionSelect(value: string): void {
    this.notify.send(value);
  }

  selectAnswer(value: string): void {
    const div = document.createElement("div");
    div.innerHTML = value;
    let text = div.textContent || div.innerText || "";
    if (text.startsWith('"')) {
      text = text.substring(1);
    }
    if (text.endsWith('"')) {
      text = text.substring(0, text.length - 1);
    }

    //    this.notify.send(text);
    this.chatService.askQuestion(text, () => {});
  }

  isAssistantDisabled(message: Message): boolean {
    if (!message.assistantId) {
      return true;
    } else if (!this.CHAT.assistantIds.includes(message.assistantId)) {
      return true;
    } else if (!this.CHAT.assistant[message.assistantId]) {
      return true;
    } else {
      return false;
    }
  }

  getAssistantImage(message: Message): string {
    if (this.isAssistantDisabled(message)) {
      return "assets/images/" + message.assistantDetails.image;
    } else {
      return "assets/images/" + this.CHAT.assistant[message.assistantId].image;
    }
  }

  getAssistantName(message: Message): string {
    if (this.isAssistantDisabled(message)) {
      return message.assistantDetails.name;
    } else {
      return this.CHAT.assistant[message.assistantId].name;
    }
  }

  showPrevious(): void {
    this.chatService.showPreviousHistory();
  }

  showHistoryButton(): boolean {
    return (
      this.authService.isAuthenticated() && this.chatService.isMoreHistory()
    );
  }

  round(num: number): number {
    return Math.round(num);
  }

  getServerUrl(): string {
    return Utils.getServerUrl();
  }

  isVideo(submsg: MessagePartSubMessage): boolean {
    return submsg.type == MessagePartSubMessageType.VIDEO;
  }
}
