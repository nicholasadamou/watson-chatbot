import { BrowserModule } from "@angular/platform-browser";
import { NgModule, APP_INITIALIZER } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { OverlayModule } from "@angular/cdk/overlay";
import { AppMaterialModule } from "./modules/app-material/app-material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AppLoadService } from "./services/app-load.service";
import { AppComponent } from "./app.component";
import { Routing } from "./app.routing";
import { ChatService } from "./services/chat.service";
import { AuthenticationService } from "./services/authentication.service";
import { ChatComponent } from "./pages/chat/chat.component";
import { ConfigComponent } from "./pages/config/config.component";
import { HelpComponent } from "./pages/help/help.component";
import { ErrorComponent } from "./pages/error/error.component";
import { FooterComponent } from "./components/footer/footer.component";
import { SafeHtmlPipe } from "./pipes/safe-html.pipe";
import { GenericDialogComponent } from "./dialogs/generic-dialog/generic-dialog.component";
import { ImageDialogComponent } from "./dialogs/image-dialog/image-dialog.component";
import { GenericTooltipComponent } from "./dialogs/generic-tooltip/generic-tooltip.component";
import { YesNoDialogComponent } from "./dialogs/yes-no-dialog/yes-no-dialog.component";
import { QuestionsPopupComponent } from "./dialogs/questions-popup/questions-popup.component";
import { FlexLayoutModule } from "@angular/flex-layout";

export function startupServiceFactory(
  appLoadService: AppLoadService
): Function {
  return () => appLoadService.getSettings();
}

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    ConfigComponent,
    HelpComponent,
    FooterComponent,
    SafeHtmlPipe,
    ErrorComponent,
    GenericDialogComponent,
    ImageDialogComponent,
    GenericTooltipComponent,
    QuestionsPopupComponent,
    YesNoDialogComponent,
  ],
  entryComponents: [
    GenericDialogComponent,
    ImageDialogComponent,
    YesNoDialogComponent,
    QuestionsPopupComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    OverlayModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppMaterialModule,
    Routing,
    FlexLayoutModule,
  ],
  providers: [
    AppLoadService,
    {
      provide: APP_INITIALIZER,
      useFactory: startupServiceFactory,
      deps: [AppLoadService],
      multi: true,
    },
    GenericTooltipComponent,
    ChatService,
    AuthenticationService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
