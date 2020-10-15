import { Injectable, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "../services/config.service";
import { Utils } from "../utils";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AppLoadService {
  constructor(
    private http: HttpClient,
    private injector: Injector,
    private configService: ConfigService
  ) {}

  getSettings(): Promise<any> {
    return new Promise((resolve, reject) => {
      return this.http
        .get<any>(`${Utils.getServerUrl()}/env`)
        .toPromise()
        .then((data: any) => {
          environment.server.isLocal = data.env.isLocal;
          environment.server.banner = data.env.banner;

          environment.server.api = data.api;

          console.log("Server configuration loaded.", data);
          console.log("Initial environment loaded.", environment);

          this.configService.loadConfig();

          resolve();
        })
        .catch((err: any) => {
          const router = this.injector.get(Router);
          environment.error = true;
          console.error("Server configuration load failed.");
          router.navigate(["/app-error"]);
          resolve();
        });
    });
  }
}
