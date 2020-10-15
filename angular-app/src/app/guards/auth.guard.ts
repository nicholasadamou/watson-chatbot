import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Utils } from '../utils';
import { MESSAGE_LOGIN_NOT_IDENTIFIED } from '../app.constants';
import { AuthenticationService } from '../services/authentication.service';
import { ChatService } from '../services/chat.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthGuard implements CanActivate {
  CHAT: any = environment.server.api['chat'];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthenticationService,
    private chatService: ChatService
  ) {}

  canActivate(route: ActivatedRouteSnapshot /*, state: RouterStateSnapshot*/) {
    // We don't actually enforce authentication in this guard.
    // This is because the application can be used anonymously or authenticated.
    // Instead, we implement a login handshake, as well as check if user is still authenticated to take appropriate actions.

    // Part of the login handshake.
    // When there is a "login=true" param, we must load the user info locally.
    const param: string = route.queryParamMap.get('login');
    if (param) {
      if (param.toUpperCase() === 'TRUE') {
        // If server indicates a successful authentication, then retrieve the user information.
        this.http
          .get<any>(
            `${Utils.getServerUrl()}/api/user/info`
          )
          .subscribe((result) => {
            if (result.authenticated) {
              this.authService.saveUser(result.userInfo);
              this.authService.loadPhoto();
            } else {
              this.chatService.addMessage(
                MESSAGE_LOGIN_NOT_IDENTIFIED(
                  this.CHAT.loginErrorMessage.message,
                  this.CHAT.loginErrorMessage.submessage
                )
              );
            }
          });

        // Remove the parameters for bookmarking and other purposes.
        this.router.navigate(["/"]);

        return false;
      } else {
        this.chatService.addMessage(
          MESSAGE_LOGIN_NOT_IDENTIFIED(
            this.CHAT.loginErrorMessage.message,
            this.CHAT.loginErrorMessage.submessage
          )
        );
      }

      // Remove the parameters for bookmarking and other purposes.
      this.router.navigate(["/"]);
    }

    return true;
  }
}
