export class AppConstants {
  public static USER = "user";
  public static CONFIG = "config";
  public static HISTORY = "history";
  public static QUESTIONS = "questions";
}

////////////////////////////////////////////////////////////////////////////////

export interface User {
  email: string;
  role: string;
  config?: any;
  photo?: any;
}

////////////////////////////////////////////////////////////////////////////////

// Message
//   MessagePart []
//     MessagePartSubMessage[]

export enum MessageType {
  USER,
  WATSON,
  // Special type of message that indicates a break in conversation.
  BREAK,
}

export enum MessagePartType {
  NORMAL,
  HIGHLIGHT,
  COMMENT,
  ERROR,
  ALERT,
}

export enum MessagePartSubMessageType {
  STRING,
  IMAGE,
  OPTION,
  METADATA,
  VIDEO,
}

export interface Message {
  type: MessageType;
  messages: MessagePart[];

  timestamp?: number;

  // Information regarding server response to message for WATSON type.
  confidence?: number;
  assistantId?: string;

  // This information is stored on every message. However, it is not used when
  // an assistant is still active (found from server config).  In this case, the
  // loaded server configuration is used.  However, if an assistant is deactived
  // it will no longer be returned in server configuration.  In that case, the
  // user interface will use this information to display the now deactived
  // assistant in the message history.
  assistantDetails?: any;

  // Used to indicate the message is in the history (used to style differently).
  history?: boolean;
}

export interface MessagePart {
  type: MessagePartType;
  message: string;
  submessages?: MessagePartSubMessage[];
  expanded?: boolean;
}

export interface MessagePartSubMessage {
  type: MessagePartSubMessageType;
  message: string;

  // Only used in IMAGE type.
  image?: string;
  // Only used in OPTION type.
  value?: string;
  // Only used in METADATA type.
  metadata?: any;
  expanded?: boolean;
  // Used to turn submessage into hot link for text.
  linkable?: boolean;
}

////////////////////////////////////////////////////////////////////////////////

export const MESSAGE_INTRODUCTION = (
  banner: string,
  introStatements: string[],
  chatService: any,
  callback: any
): void => {
  if (banner) {
    this.chatService.addMessage(
      {
        type: MessageType.WATSON,
        messages: {
          type: MessagePartType.HIGHLIGHT,
          message: banner,
        },
      },
      true
    );
  }

  if (introStatements && introStatements.length > 0) {
    let methods = new Array(introStatements.length);

    for (let i = 0; i < introStatements.length; i++) {
      methods[i] = () => {
        let promise = new Promise((resolve) => {
          setTimeout(() => {
            chatService.askQuestion(
              introStatements[i],
              () => {
                resolve({});
              },
              true,
              true,
              true,
              true,
              true,
              false
            );
          }, 100);
        });
        return promise;
      };
    }

    let p = methods[0]({});
    for (let i = 1; i < methods.length; i++) {
      p = p.then(methods[i]);
    }
    p.then(() => {
      callback();
    });
  }
};

export const MESSAGE_LOGIN_NOT_IDENTIFIED = (
  message: string,
  submessage: string
): Message => {
  const msg: Message = {
    type: MessageType.WATSON,
    messages: [],
  };
  const msgPart: MessagePart = {
    type: MessagePartType.ERROR,
    message: message,
  };
  if (submessage) {
    msgPart.submessages = [
      {
        type: MessagePartSubMessageType.STRING,
        message: submessage,
      },
    ];
  }
  msg.messages.push(msgPart);
  return msg;
};

export const MESSAGE_ENTER_QUESTION = (isAuthenticated: boolean): Message => {
  const msgs: MessagePart[] = [];
  if (!isAuthenticated) {
    msgs.push({
      type: MessagePartType.HIGHLIGHT,
      message: 'Type <i>"login"</i> to authenticate.',
    });
  }

  msgs.push({
    type: MessagePartType.NORMAL,
    message: "Who are you?",
  });

  return {
    type: MessageType.USER,
    messages: msgs,
  };
};

export const MESSAGE_DO_NOT_UNDERSTAND: Message = {
  type: MessageType.WATSON,
  messages: [
    {
      type: MessagePartType.NORMAL,
      message: "Sorry, I did not understand the question.",
    },
  ],
};

export const MESSAGE_UNABLE_TO_COMMUNICATE = (
  errorMessage: string
): Message => {
  return {
    type: MessageType.WATSON,
    messages: [
      {
        type: MessagePartType.ERROR,
        message: errorMessage,
      },
    ],
  };
};

export const MESSAGE_SERVER_LOGGED_OUT: Message = {
  type: MessageType.WATSON,
  messages: [
    {
      type: MessagePartType.HIGHLIGHT,
      message: "You have been logged out.",
    },
  ],
};

////////////////////////////////////////////////////////////////////////////////
