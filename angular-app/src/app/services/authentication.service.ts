import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { NotifyService } from "./notify.service";
import { AppConstants } from "../app.constants";
import { User } from "../app.constants";
import { Utils } from "../utils";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  constructor(private http: HttpClient, private notify: NotifyService) {}

  login(): void {
    let url = Utils.getServerUrl() + "/auth/login";

    // Must pass the port / protocol so that the sever knows where to callback to client via redirect
    url = `${url}?port=${location.port}`;
    url = `${url}&protocol=${location.protocol.replace(":", "")}`;

    window.location.href = url;
  }

  logout(): void {
    // Logout from the server.
    this.http.get<any>(`${Utils.getServerUrl()}/auth/logout`).subscribe(
      (resp) => {
        console.log(resp);
      },
      (/*error*/) => {
        // DO SOMETHING ON FAILURE.
      }
    );

    this.notify.logout();

    localStorage.removeItem(AppConstants.USER);
    localStorage.removeItem(AppConstants.QUESTIONS);
    environment.state.chatInitialized = false;
    return;
  }

  saveUser(user: User): void {
    localStorage.setItem(AppConstants.USER, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const user: any = localStorage.getItem(AppConstants.USER);

    return (
      !environment.state.embeddedMode && user !== undefined && user != null
    );
  }

  getUser(): User {
    return JSON.parse(localStorage.getItem(AppConstants.USER));
  }

  getEmail(): string {
    return this.isAuthenticated() ? this.getUser().email : undefined;
  }

  getRole(): string {
    return this.isAuthenticated() ? this.getUser().role : undefined;
  }

  isPhotoAvailable(): boolean {
    return this.isAuthenticated() && this.getUser().photo != undefined;
  }

  getPhoto(): any {
    return this.isAuthenticated() ? this.getUser().photo : undefined;
  }

  loadPhoto(): void {
    const user: User = this.getUser();
    if (user) {
      if (!user.photo) {
        const email: string = user.email;
        if (user.email) {
          this.http
            .get(`${Utils.getServerUrl()}/api/user/photo?email=${email}`, {
              responseType: "blob",
            })
            .subscribe((image: Blob) => {
              if (image && image.size > 0) {
                const reader = new FileReader();
                if (user) {
                  reader.addEventListener(
                    "load",
                    () => {
                      user.photo = reader.result;
                      this.saveUser(user);
                    },
                    false
                  );
                }
                reader.readAsDataURL(image);
              }
            });
        }
      }
    }
  }
}
