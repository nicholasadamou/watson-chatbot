import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ConfigService } from "../../services/config.service";
import { AuthenticationService } from "../../services/authentication.service";
import { ChatService } from "../../services/chat.service";
import { MatDialog } from "@angular/material/dialog";
import { YesNoDialogComponent } from "../../dialogs/yes-no-dialog/yes-no-dialog.component";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-config",
  templateUrl: "./config.component.html",
  styleUrls: ["./config.component.css"],
})
export class ConfigComponent implements OnInit {
  configForm: FormGroup;
  env: any;

  constructor(
    private formBuilder: FormBuilder,
    private configService: ConfigService,
    private chatService: ChatService,
    public authService: AuthenticationService,
    public yesNoDialog: MatDialog
  ) {
    this.env = environment;

    this.configForm = this.formBuilder.group({
      confidence: [{ id: 1, name: "Show Confidence" }],
      introduction: [{ id: 2, name: "Show Introduction" }],
      timestamps: [{ id: 3, name: "Show Message Timestamps" }],
    });
    this.configForm.valueChanges.subscribe((val) => {
      let v1: boolean = val.confidence ? true : false;
      let v2: boolean = val.introduction ? true : false;
      let v3: boolean = val.timestamps ? true : false;

      environment.config.showConfidence = v1;
      environment.config.showIntroduction = v2;
      environment.config.showTimestamps = v3;

      this.configService.saveConfig();
    });

    this.setValues();
  }

  setValues(): void {
    let v1: boolean = environment.config.showConfidence;
    let v2: boolean = environment.config.showIntroduction;
    let v3: boolean = environment.config.showTimestamps;

    this.configForm.get("confidence").setValue(v1);
    this.configForm.get("introduction").setValue(v2);
    this.configForm.get("timestamps").setValue(v3);
  }

  ngOnInit() {}

  openYesNoDialog(): void {
    const dialogRef = this.yesNoDialog.open(YesNoDialogComponent, {
      data: {
        title: "Reset all",
        description:
          "This will clear all of your chat history and reset your configuration settings.  Do you want to continue?",
        action: "Yes",
        canceled: true,
      },
    });

    dialogRef.afterClosed().subscribe((yes) => {
      if (yes) {
        this.chatService.clearHistory();
        this.chatService.clearMessages();
        this.chatService.clearQuestions();
        this.configService.resetConfig();
        this.setValues();
      }
    });
  }
}
