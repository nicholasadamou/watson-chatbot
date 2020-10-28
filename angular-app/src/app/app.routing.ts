import { Routes, RouterModule } from "@angular/router";

import { ChatComponent } from "./pages/chat/chat.component";
import { ConfigComponent } from "./pages/config/config.component";
import { HelpComponent } from "./pages/help/help.component";
import { ErrorComponent } from "./pages/error/error.component";

const appRoutes: Routes = [
  { path: "", component: ChatComponent },
  { path: "app-config", component: ConfigComponent },
  { path: "app-help", component: HelpComponent },

  { path: "app-error", component: ErrorComponent },

  // Otherwise redirect to home.
  { path: "**", redirectTo: "" },
];

export const Routing = RouterModule.forRoot(appRoutes);
