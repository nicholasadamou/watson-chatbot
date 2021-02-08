import {Component, ElementRef, OnInit, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ChatService} from '../../services/chat.service';
import {NotifyService} from '../../services/notify.service';
import {MessagePartType, MessageType, } from '../../app.constants';
import {environment} from '../../../environments/environment';
import {interval} from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit {
  CHAT: any = environment.server.api['chat'];

  env = environment;

  chatForm: FormGroup;
  loading = false;
  submitted = false;

  config: any = environment.config;
  state: any = environment.state;

  lastSubmit: number = new Date().getTime();
  sayReminder = true;

  constructor(
    public chatService: ChatService,
    private notifyService: NotifyService,
    private formBuilder: FormBuilder,
    private footer: ElementRef,
  ) {
    const MINUTE = 1000 * 60;
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
                      'I am still here, is there a question I can answer for you?',
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

  get f() {
    return this.chatForm.controls;
  }

  ngOnInit() {
    this.chatForm = this.formBuilder.group({
      question: ['', [Validators.minLength(2)]],
    });

    this.chatService.subscribeToAnswer(() => {
      this.loading = false;

      this.scrollToBottom();
    });

    this.notifyService.subscribeToSend((value) => {
      this.f.question.setValue(value);

      this.scrollToBottom();
    });
  }

  onSubmit() {
    this.submitted = true;
    this.lastSubmit = new Date().getTime();

    const msg: string = this.f.question.value;

    if (!this.f.question.value || this.chatForm.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.f.question.setValue('');

    if (this.env.state.embeddedMode) {
      this.chatService.askQuestion(msg, () => {
        this.scrollToBottom();
      });
    } else if (!this.processCommands(msg)) {
      this.chatService.askQuestion(msg, () => {
        this.scrollToBottom();
      });
    }

    this.chatService.notifyAnswer();
  }

  processCommands(msg: string): boolean {
    let processed = false;

    const command = msg.toUpperCase();

    if (command === 'HELP') {
      if (this.CHAT.startStatements && this.CHAT.startStatements.length > 0) {
        this.chatService.askQuestion(
          this.CHAT.startStatements[0],
          () => {
            this.scrollToBottom();
          },
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
    }

    return processed;
  }

  scrollToBottom(): void {
    const document = this.footer.nativeElement.ownerDocument;
    const container = document.querySelector('.mat-sidenav-content');

    container.scrollTop = container.scrollHeight;
  }

}
