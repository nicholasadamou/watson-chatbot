import {Component, OnInit, ElementRef, ViewChild, ViewEncapsulation} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ChatService } from "../../services/chat.service";
import { NotifyService } from "../../services/notify.service";
import { AuthenticationService } from "../../services/authentication.service";
import {
  MessagePartType,
  MessageType,
  MessagePartSubMessageType,
} from "../../app.constants";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { QuestionsPopupComponent } from "../../dialogs/questions-popup/questions-popup.component";
import { environment } from "../../../environments/environment";
import { interval } from "rxjs";
import { take } from "rxjs/operators";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit {
  @ViewChild("theFooter") theFooter: ElementRef;

  CHAT: any = environment.server.api["chat"];

  env = environment;

  chatForm: FormGroup;
  loading: boolean = false;
  submitted: boolean = false;

  config: any = environment.config;
  state: any = environment.state;

  lastSubmit: number = new Date().getTime();
  sayReminder: boolean = true;

  constructor(
    public chatService: ChatService,
    public authService: AuthenticationService,
    private notifyService: NotifyService,
    private formBuilder: FormBuilder,
    private questionsSheet: MatBottomSheet
  ) {
    const MINUTE = 1 * 1000 * 60;
    interval(MINUTE)
      .pipe()
      .subscribe(() => {
        if (!this.env.state.embeddedMode && this.sayReminder) {
          const doIt =
            new Date().getTime() - this.lastSubmit >
            this.env.reminderTimeout * MINUTE;
          if (doIt) {
            this.lastSubmit = new Date().getTime();
            this.chatService.addMessage(
              {
                type: MessageType.WATSON,
                messages: [
                  {
                    type: MessagePartType.NORMAL,
                    message:
                      "I am still here, is there a question I can answer for you?",
                  },
                  {
                    type: MessagePartType.NORMAL,
                    message:
                      'If you are having trouble, type <i>"help"</i> to get more information.',
                  },
                ],
              },
              true
            );
            this.chatService.notifyAnswer();
            this.sayReminder = false;
          }
        }
      });
  }

  ngOnInit() {
    this.chatForm = this.formBuilder.group({
      question: ["", [Validators.minLength(2)]],
    });

    this.chatService.subscribeToAnswer(() => {
      this.loading = false;
      this.scrollToBottom();
    });

    this.notifyService.subscribeToSend((value) => {
      this.f.question.setValue(value);
      this.scrollToBottom();
    });

    this.notifyService.subscribeToScroll(() => {
      this.scrollToBottom();
    });
  }

  get f() {
    return this.chatForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.lastSubmit = new Date().getTime();

    let msg: string = this.f.question.value;

    if (!this.f.question.value || this.chatForm.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.f.question.setValue("");

    if (this.env.state.embeddedMode) {
      this.chatService.askQuestion(msg, () => {});
    } else if (!this.processCommands(msg)) {
      this.chatService.askQuestion(msg, () => {});
    }
  }

  openQuestionSheet() {
    this.questionsSheet.open(QuestionsPopupComponent);
  }

  processCommands(msg: string): boolean {
    let processed = false;

    const command = msg.toUpperCase();

    if (command == "HELP") {
      this.commandAssistants();

      if (this.CHAT.startStatements && this.CHAT.startStatements.length > 0) {
        this.chatService.askQuestion(
          this.CHAT.startStatements[0],
          () => {},
          true,
          true,
          true,
          true,
          false,
          true
        );
      }

      this.loading = false;
      processed = true;
    } else if (
      command == "CHATBOT" ||
      command == "CHATBOTS" ||
      command == "ASSISTANT" ||
      command == "ASSISTANTS"
    ) {
      this.commandAssistants();

      this.loading = false;
      processed = true;
    }

    if (processed) {
      //this.chatService.addQuestionHistory(msg);
    }

    return processed;
  }

  // Make sure we see the "Ask" button.
  scrollToBottom(): void {
    if (this.env.state.embeddedMode) {
      interval(400)
        .pipe(take(1))
        .subscribe(() => {
          this.theFooter.nativeElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
    } else {
      interval(400)
        .pipe(take(1))
        .subscribe(() => {
          this.theFooter.nativeElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
    }
  }

  validateEmail(email: string): boolean {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  //////////////////////////////////////////////////////////////////////////////

  commandAssistants(): void {
    const api: any = environment.server.api;
    const chat = api.chat;

    const mgs = [];
    mgs.push({
      type: MessagePartType.NORMAL,
      message: "The following assistants are here with me to help you!",
    });

    for (let i = 0; i < chat.assistantIds.length; i++) {
      if (
        !chat.assistant[chat.assistantIds[i]].hidden &&
        !chat.assistant[chat.assistantIds[i]].default
      ) {
        mgs.push({
          type: MessagePartType.HIGHLIGHT,
          message:
            "<b>" +
            chat.assistant[chat.assistantIds[i]].name +
            "</b> " +
            chat.assistant[chat.assistantIds[i]].description,
        });
        mgs.push({
          type: MessagePartType.NORMAL,
          message: "",
          submessages: [
            {
              message: "",
              type: MessagePartSubMessageType.IMAGE,
              image:
                "assets/images/" + chat.assistant[chat.assistantIds[i]].image,
            },
          ],
        });
      }
    }

    this.chatService.addMessage({
      type: MessageType.WATSON,
      messages: mgs,
    });
    this.chatService.notifyAnswer();
  }
}
