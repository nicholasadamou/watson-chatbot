import { Injectable } from "@angular/core";
import { HttpClient /*, HttpHeaders*/ } from "@angular/common/http";
import { AuthenticationService } from "../services/authentication.service";
import { NotifyService } from "../services/notify.service";
import {
  MessagePartSubMessage,
  MessagePartSubMessageType,
  MessagePartType,
  MessagePart,
  MessageType,
  Message,
  MESSAGE_DO_NOT_UNDERSTAND,
  MESSAGE_UNABLE_TO_COMMUNICATE,
} from "../app.constants";
import { AppConstants } from "../app.constants";
import { Utils } from "../utils";
import { environment } from "../../environments/environment";
import * as Rx from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ChatService {
  CONFIG: any = environment.config;
  CHAT: any = environment.server.api["chat"];

  pending: boolean = false;
  messages: Message[] = [];

  answerEvent = new Rx.Subject();

  apiSession: any = undefined;

  history: any = [];
  historySlot: number = 0;
  historyShowSlot: number = 0;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private notify: NotifyService
  ) {}

  startNewHistory(): void {
    if (!this.authService.isAuthenticated()) return;

    if (!localStorage.getItem(AppConstants.HISTORY)) {
      localStorage.setItem(AppConstants.HISTORY, JSON.stringify([]));
    }

    let historySlots = JSON.parse(localStorage.getItem(AppConstants.HISTORY));

    // Special case.
    // Remove any history with only one message.
    // This is because we automatically add the first message as the page break and timestamp.
    // So if this is the only thing in the history, purge it.
    for (let i = 0; i < historySlots.length; i++) {
      if (historySlots[i].length <= 1) {
        historySlots.splice(i, 1);
      }
    }

    while (historySlots.length > 10) {
      historySlots.splice(0, 1);
      localStorage.setItem(AppConstants.HISTORY, JSON.stringify(historySlots));
    }

    this.historySlot = historySlots.length;

    if (historySlots.length - 1 > 0) {
      this.historyShowSlot = historySlots.length - 1;
    }
  }

  clearHistory(): void {
    this.history = [];
    this.historySlot = 0;
    this.historyShowSlot = 0;

    localStorage.setItem(AppConstants.HISTORY, JSON.stringify(this.history));
  }

  clearQuestions(): void {
    localStorage.removeItem(AppConstants.QUESTIONS);
  }

  getQuestionHistory(): any[] {
    let qs = [];
    const q = localStorage.getItem(AppConstants.QUESTIONS);
    if (q) {
      qs = JSON.parse(q);
    }
    return qs;
  }

  showPreviousHistory(): void {
    if (!this.authService.isAuthenticated()) return;

    const historySlots = JSON.parse(localStorage.getItem(AppConstants.HISTORY));
    if (this.historyShowSlot >= 0) {
      const historySlot = historySlots[this.historyShowSlot--];

      for (let i = historySlot.length - 1; i >= 0; i--) {
        this.messages.unshift(historySlot[i]);
      }
    }
  }

  isMoreHistory(): boolean {
    return (
      this.authService.isAuthenticated() &&
      this.historyShowSlot >= 0 &&
      this.historySlot != this.historyShowSlot
    );
  }

  clearMessages(): void {
    this.messages = [];
  }

  subscribeToAnswer(callback: any): void {
    this.answerEvent.subscribe(callback);
  }

  notifyAnswer(): void {
    this.answerEvent.next();
  }

  setQuestionPending(val: boolean): void {
    this.pending = val;
  }

  isQuestionPending(): boolean {
    return this.pending;
  }

  clearApiSession(): void {
    this.apiSession = undefined;
  }

  askQuestion(
    question: string,
    callback: any,
    hideQuestion: boolean = false,
    indicatePending: boolean = true,
    suppressConfidence: boolean = false,
    skipLock: boolean = false,
    skipHistory: boolean = false,
    makeSubmsgsLinkable: boolean = false
  ): void {
    if (this.pending) {
      callback(false);
    } else {
      if (indicatePending) {
        this.pending = true;
      }

      if (question === "[Object object]" || typeof question !== "string") {
        return;
      }

      if (!hideQuestion) {
        const userMsgPart: MessagePart = {
          type: MessagePartType.NORMAL,
          message: question,
        };
        const userMsg: Message = {
          type: MessageType.USER,
          messages: [userMsgPart],
        };
        this.addMessage(userMsg, skipHistory);
      }

      const confidenceThreshold = this.CONFIG.confidenceThreshold;

      const msg: any = {
        message: question,
      };

      // If "locked into" an assistant, then provide it.
      if (this.apiSession) {
        msg.apiSession = this.apiSession;
      }

      // If instruct server not to attempt to lock.
      if (skipLock) {
        msg.skipLock = true;
      }

      this.http
        .post<any>(`${Utils.getServerUrl()}/api/chat/message`, msg, {
          observe: "response",
        })
        .subscribe(
          (resp) => {
            const data = resp.body ? resp.body : {};

            const response: any[] = data.processedResponse;

            const confidence: number = data.confidence;

            // Response should return with assistant ID that responded
            let assistantId: string = data.assistantId;

            if (!assistantId && this.CHAT.assistantDefault) {
              assistantId = this.CHAT.assistantDefault;
            }

            // Check to see if server has "locked into" an assistant. If so, then make sure to respond with it next time.
            if (data.apiSession) {
              this.apiSession = JSON.parse(JSON.stringify(data.apiSession));
            } else {
              this.apiSession = undefined;
            }

            if (!confidence || confidence < confidenceThreshold || !response) {
              this.addMessage(MESSAGE_DO_NOT_UNDERSTAND, skipHistory);
            } else {
              const msgParts: MessagePart[] = [];

              let supressMisunderstoodMessage = false;

              for (let i = 0; i < response.length; i++) {
                if (response[i].response_type) {
                  if (response[i].response_type === "TEXT") {
                    let embeddedVideo = undefined;

                    if (
                      response[i].message &&
                      response[i].message.startsWith("VIDEO(")
                    ) {
                      const ij = response[i].message.indexOf(")");
                      if (ij != -1) {
                        embeddedVideo = response[i].message
                          .substring(6, ij)
                          .trim();
                        response[i].message = response[i].message
                          .substring(ij + 1)
                          .trim();
                      }
                    }

                    const msgPart: MessagePart = {
                      type: MessagePartType.NORMAL,
                      message: response[i].message,
                    };
                    if (response[i].type) {
                      if (response[i].type === "HIGHLIGHT") {
                        msgPart.type = MessagePartType.HIGHLIGHT;
                      } else if (response[i].type === "ERROR") {
                        msgPart.type = MessagePartType.ERROR;
                      } else if (response[i].type === "ALERT") {
                        msgPart.type = MessagePartType.ALERT;
                      }
                    }

                    if (response[i].submessages || embeddedVideo) {
                      const msgPartSubMessages: MessagePartSubMessage[] = [];

                      if (embeddedVideo) {
                        const smp: MessagePartSubMessage = {
                          type: MessagePartSubMessageType.VIDEO,
                          message: embeddedVideo,
                          linkable: false,
                        };

                        msgPartSubMessages.push(smp);
                      }

                      if (response[i].submessages) {
                        for (
                          let j = 0;
                          j < response[i].submessages.length;
                          j++
                        ) {
                          const smp: MessagePartSubMessage = {
                            type: response[i].submessages[j].metadata
                              ? MessagePartSubMessageType.METADATA
                              : MessagePartSubMessageType.STRING,
                            message: response[i].submessages[j].message,
                            linkable: makeSubmsgsLinkable,
                          };

                          if (response[i].submessages[j].metadata) {
                            smp.metadata = response[i].submessages[j].metadata;
                            smp.metadata.uuid = response[i].submessages[j].uuid;
                          }

                          msgPartSubMessages.push(smp);
                        }
                        msgPart.submessages = msgPartSubMessages;

                        if (msgPart.submessages.length < 6) {
                          msgPart.expanded = true;
                        }
                      }
                    }

                    if (msgPart.message) {
                      msgParts.push(msgPart);
                    } else {
                      supressMisunderstoodMessage = true;
                    }
                  } else if (response[i].response_type === "IMAGE") {
                    const msgPart: MessagePart = {
                      type: MessagePartType.NORMAL,
                      message: response[i].title ? response[i].title : "",
                      submessages: [
                        {
                          type: MessagePartSubMessageType.IMAGE,
                          message: response[i].description
                            ? response[i].description
                            : "",
                          image: response[i].source,
                        },
                      ],
                    };

                    msgParts.push(msgPart);
                  } else if (response[i].response_type === "OPTION") {
                    const msgPartSubMessages: MessagePartSubMessage[] = [];

                    if (response[i].description) {
                      msgPartSubMessages.push({
                        type: MessagePartSubMessageType.STRING,
                        message: response[i].description,
                      });
                    }
                    if (response[i].options) {
                      for (let j = 0; j < response[i].options.length; j++) {
                        msgPartSubMessages.push({
                          type: MessagePartSubMessageType.OPTION,
                          message: response[i].options[j].label,
                          value: response[i].options[j].value.input.text,
                        });
                      }
                    }

                    const msgPart: MessagePart = {
                      type: MessagePartType.NORMAL,
                      message: response[i].title ? response[i].title : "",
                      submessages: msgPartSubMessages,
                      expanded: true,
                    };

                    msgParts.push(msgPart);
                  }
                }
              }

              if (!hideQuestion) {
                this.addQuestionHistory(question);
              }

              if (msgParts.length > 0) {
                const msg: Message = {
                  type: MessageType.WATSON,
                  messages: msgParts,
                  confidence: suppressConfidence ? undefined : confidence,
                  assistantId: assistantId ? assistantId : undefined,
                };

                this.addMessage(msg, skipHistory);
              } else if (!supressMisunderstoodMessage) {
                this.addMessage(MESSAGE_DO_NOT_UNDERSTAND, skipHistory);
              }
            }

            this.notifyAnswer();
            this.pending = false;
            callback(true);
          },
          (/*error*/) => {
            this.addMessage(
              MESSAGE_UNABLE_TO_COMMUNICATE(this.CHAT.errorMessage),
              skipHistory
            );
            this.notifyAnswer();
            this.pending = false;
            callback(false);
          }
        );
    }
  }

  addMessage(message: Message, skipHistory: boolean = false): void {
    // Add timestamp to message.
    if (!message.timestamp) {
      message.timestamp = new Date().getTime();
    }

    // Need to make sure the assistant details are set (or use default if not.)
    if (message.type == MessageType.WATSON) {
      if (!message.assistantId) {
        message.assistantId = this.CHAT.assistantDefault;
      }

      if (message.assistantId && !message.assistantDetails) {
        if (
          this.CHAT.assistantIds.includes(message.assistantId) &&
          this.CHAT.assistant[message.assistantId]
        ) {
          message.assistantDetails = this.CHAT.assistant[message.assistantId];
        }
      }
    }

    if (!skipHistory && this.authService.isAuthenticated()) {
      // Record the history.
      const h = JSON.parse(JSON.stringify(message));
      h.history = true;
      this.history.push(h);
      const historyRecords = JSON.parse(
        localStorage.getItem(AppConstants.HISTORY)
      ) || [];
      historyRecords[this.historySlot] = this.history;
      localStorage.setItem(
        AppConstants.HISTORY,
        JSON.stringify(historyRecords)
      );
    }

    this.messages.push(message);
  }

  getMessages(): Message[] {
    this.notifyAnswer();

    return this.messages;
  }

  isMessagePartType(part: MessagePart, type: MessagePartType) {
    return part.type === type;
  }

  addQuestionHistory(question: string): void {
    let qs = [];
    const q = localStorage.getItem(AppConstants.QUESTIONS);
    if (q) {
      qs = JSON.parse(q);
    }

    let found = false;
    for (let i = 0; i < qs.length && !found; i++) {
      if (qs[i] && qs[i].toUpperCase() === question.toUpperCase()) {
        found = true;
      }
    }

    if (!found) {
      qs.push(question);
    }

    while (qs.length > 12) {
      qs.shift();
    }

    localStorage.setItem(AppConstants.QUESTIONS, JSON.stringify(qs));
  }
}
