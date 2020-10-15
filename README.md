# Watson Chatbot

![preview](previews/chatbot-preview.png)

❗The project for the Watson-based Chatbot REST API and user interface.

## 🏁 Getting Started

⚠️ Prior to installing and configuring the tooling on our system, let's first set-up our GitHub SSH keys for IBM.

- Please follow the guide found [here](https://docs.github.com/en/enterprise/2.21/user/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account) to configure your GitHub Enterprise account to use your new (or existing) SSH key.

### Configuration

Please edit [server/config.js](server/config.js) for local development.

### Set Up

**Clone** the [chatbot](https://github.ibm.com/nicholasadamou/watson-chatbot) repository:

```bash
git clone git@github.com:nicholasadamou/watson-chatbot.git
```

**Create .env** that contains some of the following _secrets_.

```text
CHAT_KEY=<The key provided to you for the Watson Assistant instance you set up>
JWT_KEY=<The JWT key used in part of JWT token verification>
JWT_SECRET=<The JWT secret used in part of JWT token verification>
ENV=<Which "env" to load configuration for [dev, test, prod]>
DEBUG=<If enabled, adds additional REST APIs for debugging for development purposes (e.g. get the environment details). Should not be enabled in Prod cause it can include secret/credential details>
```

### Using `node`

#### Using `dev` npm run script

The below script will first, install node dependencies for [angular-app](angular-app) and [server](server), then build the [angular-app](angular-app) and copy it over to [server/ui](server/ui). Finally, it will execute `nodemon` against [server/server.js](server/server.js).

```bash
npm run dev
```

In order to access the front-end UI using this script, you need to visit: [http://localhost:6001/chatbot](http://localhost:6001/chatbot).

#### Running client & server separately

**STEP 1**: Install Node dependencies:

```bash
npm install
```

**STEP 2**: Install Angular and [nodemon](https://nodemon.io) if not already installed:

```bash
npm install -g @angular/cli nodemon
```

**STEP 3**: Execute [nodemon](https://nodemon.io):

```bash
nodemon server/server.js
```

This will setup the server and tells the server to listen on port `6001` @ the URL: `localhost:6001`.

**STEP 4**: In a different terminal instance from the `chatbot` directory execute:

```bash
cd angular-app && ng serve
```

To access the front-end UI after executing `ng serve` in a seperate terminal instance, you need to visit: [http://localhost:4200/chatbot](http://localhost:4200/chatbot).

### Using `docker`

**STEP 1**: Use `make` to build the docker image.

```bash
make all
```

**Step 2**: Start the docker container.

```bash
docker-compose up
```

**tldr;**

Execute the following:

```bash
npm run docker
```

This command will execute `make` and `docker-compose` as well as `npm run clean`.

In order to access the front-end UI using this script, you need to visit: [http://localhost:6001/chatbot](http://localhost:6001/chatbot).

## 🔐 How User Authentication Works

This application assumes that the authentication flow that the parent web application (e.g. [test/](test/)) is using is **SSO** with _JWT_.

The authentication flow starts with the user typing `login` into the front-end of the chatbot. The chatbot back-end server obtains the encoded JWT token from the domain cookie which was generated during the SSO authentication flow from the parent web application. It then reads, decodes, and verifies that JWT Token and if successful, the chatbot back-end server ([server/server.js](server/server.js)) will redirect the front-end ([angular-app](angular-app)) to `$PROTOCOL://$HOST:\$PORT?login=true` indicating successful authentication. The front-end will then utilize [auth.guard](angular-app/src/guards/auth.guard.ts) and make a request for 1) the decoded user stored on the back-end server and 2) the avatar of that user which will then be displayed on the front-end UI.

**Roles**:

**0** : No-role (no-access e.g. Anonymous)

- Occurs if JWT token is not verified, is invalid, or does not exist or application is run in DEV mode (e.g. `process.env.ENV === DEV`).

**X** : Role determined by user login

- Occurs if JWT token is verified, not invalid, and does exist and application is not running in DEV mode.

**Authentication States**:

1. _Anonymous_

- Client uses no-role, limited access.

1. _Authenticated_

- Client uses role determined by the verified and decoded JWT Token obtained from the domain cookie.

There are 2 modes authentication can run in:

1. Local. No sessions because of cross site cookie issue; uses fake single session.

1. Cloud with sessions.

Request for 'user/info' returns (if the JWT token is not verified or is invalid):

```js
const userInfo = {};
```

**Login Flow**:

- Client -> '/isLocal' to determine if running locally.
- Client -> '/auth/login' Redirects to server for authentication.
  - Passes PORT/PROTOCOL in use by client so redirect knows where to call back.
- Server ->
  - Reads, decodes, and verifies the JWT Token received from the authentication flow.
  - Redirects client to $PROTOCOL://$HOST:\$PORT?login=false
    - This state occurs if the decoded JWT Token has expired or is invalid. The system views the user as anonymous.
  - Redirects client to $PROTOCOL://$HOST:\$PORT?login=true
    - If there is the query parameter (checked in AuthGuard), Client -> '/api/user/info'
      - If nothing returned, then login failed; otherwise, save information locally.
    - Client -> '/api/\*\*'
      - Check for 'Chat-Session-ID' response header
        - If Client unauth, Chat-Session-ID = undefined
          - Do nothing
        - If Client auth'd, Chat-Session-ID = undefined
          - Set client unauth (delete local user info)
        - If Client unauth, Chat-Session-ID = defined
          - Go to Client -> '/api/user/info' action
        - If Client auth'd, Chat-Session-ID = defined
          - Do nothing

**Logout Flow**:

- Client -> '/auth/logout'
- Client delete local user info

## User Commands

There are various commands available to the user.

1. `login`: Will attempt to impersonate the user (_if not currently logged in_).
2. `logout`: Will logout the currently authenticated user from the chatbot if the user isn't already authenticated.
3. `help`: Will list out the assistants that are there to help you as well as launch the commands found within the [server/config.js](server/config.js) under `services.chat.startStatements`.
4. `assistants`, `chatbot`, `assistants`, `chatbots`: Will list out the assistants that are there to help you.
