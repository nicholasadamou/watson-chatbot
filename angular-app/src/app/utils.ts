export class Utils {
  static getServerUrl(): string {
    let appUrl: string = "";

    appUrl = location.protocol;

    if (!appUrl.endsWith(":")) {
      appUrl = appUrl + ":";
    }

    appUrl = appUrl + "//" + location.hostname;

    if (location.port === "4200") {
      appUrl = appUrl + ":" + "6001";
    } else {
      appUrl = appUrl + ":" + location.port;
    }

    appUrl = appUrl + "/chatbot";

    return appUrl;
  }

  static getCookieByName(name: string): any {
    let cookies: any = document.cookie;
    let cookiestore = {};

    cookies = cookies.split(";");

    if (cookies[0] == "" && cookies[0][0] == undefined) {
      return undefined;
    }

    cookies.forEach(function (cookie) {
      cookie = cookie.split(/=(.+)/);
      if (cookie[0].substr(0, 1) == " ") {
        cookie[0] = cookie[0].substr(1);
      }
      cookiestore[cookie[0]] = cookie[1];
    });

    return name !== "" ? cookiestore[name] : cookiestore;
  }
}
