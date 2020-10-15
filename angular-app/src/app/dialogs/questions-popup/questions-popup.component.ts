import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-questions-popup',
  templateUrl: './questions-popup.component.html',
  styleUrls: ['./questions-popup.component.css']
})
export class QuestionsPopupComponent implements OnInit {

  constructor(
    public chatService: ChatService,
    private questionsPopup: MatBottomSheetRef<QuestionsPopupComponent>,
  ) { }

  ngOnInit() {
  }

  openLink(event: MouseEvent, question: string): void {

    this.questionsPopup.dismiss();
    event.preventDefault();
    this.chatService.askQuestion(question, () => {});
  }

  getQuestions(): any[] {
    return this.chatService.getQuestionHistory();
  }
}
