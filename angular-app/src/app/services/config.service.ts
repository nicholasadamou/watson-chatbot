import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { AppConstants } from "../app.constants";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  constructor() {}

  saveConfig(): void {
    localStorage.setItem(
      AppConstants.CONFIG,
      JSON.stringify(environment.config)
    );
  }

  loadConfig(): void {
    let config: any = JSON.parse(localStorage.getItem(AppConstants.CONFIG));
    if (!config) {
      this.resetConfig();
    }

    if (!config) {
      this.saveConfig();
      config = JSON.parse(localStorage.getItem(AppConstants.CONFIG));
    }
    environment.config = config;
  }

  resetConfig(): void {
    environment.config = JSON.parse(JSON.stringify(environment.configDefault));
    this.saveConfig();
  }
}
