# Carbon Kickstarter

This project is the source material for using the
[Carbon Design System](https://www.carbondesignsystem.com/) with React.

# tldr;

Clone this repo, install debs, copy carbon scss, and start the development server:

```bash
git clone https://github.com/nicholasadamou/carbon-kickstarter && \
    cd carbon-kickstarter && \
        yarn install && \
        yarn start
```

or fork the [`codesandbox`](https://codesandbox.io/s/carbon-kickstarter-8l2r4?codemirror=1&eslint=1&fontsize=14) template.

# Chapter 1 - Build A Basic App

0. Prerequisites

-   NodeJS version 10.15.3 or better (use `node --version` to check)
-   NPM version 6.4.1 or better (use `npm --version` to check)
-   Yarn version 1.15.2 or better (use `yarn --version` to check)
-   MS Visual Studio Code Version 1.33 or better

1. Create the starter application

```bash
npx create-react-app carbon-kickstarter
cd carbon-kickstarter
```

2. Add SASS support to the project

```bash
yarn add node-sass
echo 'SASS_PATH="node_modules"' > .env
```

3. Start the development server

```bash
yarn start
```

4. Start VS Code

5. Install Prettier (optional)

6. Create ".prettierrc.json" with the following:

```json
{
    "trailingComma": "es5",
    "tabWidth": 4,
    "semi": true,
    "singleQuote": true
}
```

7. Prove that SCSS is working

-   rename `src/index.css` to `src/index.scss`
-   rename `src/App.css` to `src/index.scss`
-   change `src/index.js` to `include "./index.scss";`
-   change `src/App.js` to `include "./App.scss";`
-   Confirm the Application still renders correctly
    -   i.e. The logo is still spinning

8. Trim down the application to a bare bones app

-   Delete all the styles from `src/index.scss`
-   Delete all the styles from `src/App.scss`
-   In `src/App.js` Change the render function to:

```jsx
class App extends Component {
    render() {
        return (
            <div className="App">
                <div>Hello, World!</div>
            </div>
        );
    }
}
```

# Chapter 2 - Intro To SCSS and Carbon Styles

1. Add Carbon to the project

```bash
yarn add carbon-components
yarn add carbon-icons
yarn add carbon-components-react
```

2. Open `src/index.scss` add the following line:

```scss
@import 'carbon-components/scss/globals/scss/styles.scss';
```

3. Check the app page to ensure that the "Hello, World!" is now being rendered using the `Plex Plex Sans` typeface.

4. Change `App.js` to say "Hello, Carbon!" and give it a className of "page-header":

```xml
<div className="App">
    <div className="page-header">Hello, Carbon!</div>
</div>
```

5. It works! You now have a working React app with Carbon!
   &nbsp;&nbsp;
   But wait, there's more... ;-)

6. Let's add some simple styling to our app's `page-header`. Edit `App.scss` and add the following lines:

```scss
.page-header {
    min-height: 3rem;
    padding-top: 1rem;
    padding-left: 3rem;
    background-color: green;
    color: white;
}
```

7. It works, but it's ugly. Let's add the official IBM color palette, to our project.

```bash
$ yarn add @carbon/colors
```

8. Next, we need to import the palette into our app and modify the `page-header` style to use the official colors. You can see the colors that are available if you view the file `node_modules/@carbon/colors/Change`App.scss` to this:

```scss
@import '@carbon/colors/scss/colors';

.page-header {
    background-color: $carbon--blue-70;
    color: $carbon--white-0;
    padding-top: 4rem;
    padding-bottom: 1rem;
    padding-left: 3rem;
}
```

# Chapter 3 - Enable SCSS suggestions and code completion

Wouldn't it be great if our IDE could help us figure out what those variable names are? What if it could offer us suggestions to make our the life of a non-front-end developer easier? Lets configure that now!

1. Install `SCSS IntelliSense` into VS Code.

-   Press F1 and select `Extensions: Install Extensions`.
-   Search and choose `vscode-scss`.

2. Out of the box, VS Code can't "see" the Carbon stylesheets because they are in your `node_modules` folder. We'll write a little script that will make a copy of carbon's styles somewhere more accessible. The copy will also become a handy reference while developing our own components later. Edit the `scripts` section of the `package.json` folder:

extracted from `package.json`:

```json
{
    "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject",
        "copy-scss": "rm -rf @carbon & rsync -a -m ./node_modules/@carbon . --include '*.scss' --exclude '*.*' --exclude 'LICENSE'"
    }
}
```

3. We don't want these reference files getting checking into our project repository, so edit `.gitignore` and add the following lines to the end of the file:

```.gitignore
# don't save the copy of @carbon's styles in the root folder
\@carbon
```

4. Copy the reference files to start using SCSS suggestions. You will need to re-rerun this command every time you install a new @carbon package(s). That sounds like a pain, but you don't add packages very often.

```bash
yarn run copy-scss
```

Note: Sometimes, SCSS Intellisense doesn't refresh it's cache, so you might need to force it to reload. You can always exit and restart the IDE but I find the reloading the window is often all that is needed.

-   Press F1 and type `Reload` and select `Developer: Reload Window` from the drop-down.

5. Verify that the IDE is finding carbon styles by editing `App.css` and start typing
   something like `$carbon--` and it should be suggesting possible matches.

# Chapter 4 - Basic Carbon Building Blocks

1. In order to really start using Carbon, we need to pull in some other basic building blocks. We will be using `@carbon/layout` for spacing, `@carbon/type` for fonts and typography.

```bash
yarn add @carbon/layout
yarn add @carbon/type
yarn run copy-scss
```

2. Lets change our `page-header` to use more Carbon friendly units and font attributes. Make these changes one at a time to see the impact on the app.

`src/App.scss`:

```scss
@import '@carbon/colors/scss/colors';
@import '@carbon/layout/scss/spacing';
@import '@carbon/type/scss/type';

.page-header {
    background-color: $carbon--blue-70;
    color: $carbon--white-0;
    padding-top: $carbon--spacing-10;
    padding-bottom: $carbon--spacing-05;
    padding-left: $carbon--spacing-05;
    font-family: carbon--font-family('sans');
    font-weight: carbon--font-weight('semibold');
    font-size: carbon--type-scale(10);
}
```

3. Carbon makes use of SCSS "maps" to declare sets of style properties. You can use the SCSS `@include` directive with the `properties` function to take advantage of the Carbon maps. For example, there are standard typography sets for common functions like body text, page headers, etc. Let's simplify our page header to use a predefined style, `$header-01`:

```scss
@import '@carbon/colors/scss/colors';
@import '@carbon/layout/scss/spacing';
@import '@carbon/type/scss/type';

.page-header {
    background-color: $carbon--blue-70;
    color: $carbon--white-0;
    padding-top: $carbon--spacing-10;
    padding-bottom: $carbon--spacing-05;
    padding-left: $carbon--spacing-05;
    //font-family: carbon--font-family('sans');
    //font-weight: carbon--font-weight('semibold');
    @include properties($heading-01);
    font-size: carbon--type-scale(10);
}
```

# Chapter 5 - Responsive Apps

1. We have looked at colors, spacing and fonts; now lets make our app responsive to various screen sizes by using `@carbon/grid`. Let's add that package to project now:

```bash
yarn add @carbon/grid
yarn run copy-scss
```

2. To start, we'll add some code to show a few simple "cards" in our application.

`src/App.js`:

```xml
<div className="App">
    <div className="page-header">Hello, Carbon!</div>

    <div className="cards-container">
        <div className="cards">
            <div className="card">01</div>
            <div className="card">02</div>
            <div className="card">03</div>
            ... fill in the rest ...
            <div className="card">14</div>
            <div className="card">15</div>
            <div className="card">16</div>
        </div>
    </div>
</div>
```

Note: Yes, we need all 16 of the cards! It's important later on ;-)

3. Our cards need a bit of style to make them pop...
   Append the following lines to `App.scss`:

```scss
.cards-container {
    margin-top: $carbon--spacing-08;
}

.card {
    border: 1px solid $carbon--blue-30;
    border-radius: 0.25rem;
    min-height: 100px;
    padding: $carbon--spacing-03;
    background-color: $carbon--blue-10;
    font-size: carbon--type-scale(6);
}
```

4. Put them in a "generic" Carbon grid by adding `bx--grid`, `bx--row` and `bx--col` classes. In order to style the card, we need a div inside a div. We will give our interior div a class named "face":

`src/App.js`

```xml
<div className="App">
    <div className="page-header">Hello, Carbon!</div>

    <div className="bx--grid cards-container">
        <div className="bx--row cards">
            <div className="bx--col card">
                <div className="face">01</div>
            </div>
            <div className="bx--col card">
                <div className="face">02</div>
            </div>
            <div className="bx--col card">
                <div className="face">03</div>
            </div>
            ... ... fill in the rest ... ...
            <div className="bx--col card">
                <div className="face">14</div>
            </div>
            <div className="bx--col card">
                <div className="face">15</div>
            </div>
            <div className="bx--col card">
                <div className="face">16</div>
            </div>
        </div>
    </div>
</div>
```

5. Fix `App.scss` to import `@carbon/grid` and to style the "face" instead of the "card":

In `src/App.scss`:

```scss
//... previous imports ...

@import '@carbon/grid/scss/grid';

// ... other styles ...
.card {
    .face {
        border: 1px solid $carbon--blue-30;
        border-radius: 0.25rem;
        min-height: 100px;
        background-color: $carbon--blue-10;
        font-size: carbon--type-scale(4);
        padding: $spacing-02;
    }

    padding-bottom: $carbon--spacing-07;
}
```

6. We are going to make a bunch of changes to the card's class names, so we will refactor our cards into a React functional component. This will make our life easier while changing classes.

In `src/App.js`:

```jsx
import React, { Component } from 'react';
import './App.scss';

const Card = ({ children }) => (
    <div className="bx--col card">
        <div className="face">{children}</div>
    </div>
);

class App extends Component {
    render() {
        return (
            <div className="App">
                <div className="page-header">Hello, Carbon!</div>

                <div className="bx--grid cards-container">
                    <div className="bx--row cards">
                        <Card>01</Card>
                        <Card>02</Card>
                        <Card>03</Card>
                        {/* ... */}
                        <Card>14</Card>
                        <Card>15</Card>
                        <Card>16</Card>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
```

Nothing has really changed in our app, it should appear identical to the last step.

7. Convert your break point agnostic columns into small columns, which target smaller screens (i.e. mobile devices). Just change `bx--col` into `bx--sm-1`

In `src/App.js`:

```jsx
// ...
const Card = ({ children }) => (
    <div className="bx--col-sm-1 card">
        <div className="face">{children}</div>
    </div>
);
// ...
```

Note: Now we get get 4 columns of cards, regardless of the screen size, still not very responsive - but it's at least more predictable that than before.

8. Let's add more break points for screen sizes to our cards, lets add support for `md` devices (tablets) and `lg` devices (laptops).

```jsx
// ...
const Card = ({ children }) => (
    <div className="bx--col-sm-1 bx--col-md-1 bx--col-lg-1 card">
        <div className="face">{children}</div>
    </div>
);
// ...
```

9. During development with grids, it's nice to just throw the current breakpoint on the screen instead of trying to find it in Chrome's developer tools. Here is a SASS snippet you can use to put the current breakpoint on the screen:

append the following lines to `src/App.scss`:

```scss
@each $bp in map-keys($carbon--grid-breakpoints) {
    @include carbon--breakpoint-up($bp, $carbon--grid-breakpoints) {
        .current-breakpoint-name::before {
            content: '#{$bp}';
        }
    }
}
```

Then insert the following before your grid in `src/App.js`:

```xml
<div>Current: <span className="current-breakpoint-name" /></div>
```

10. Try commenting out the `@import @carbon/grid...` line in `App.scss` and see what happens.

In `src/Apps.scss`:

```scss
@import '@carbon/colors/scss/colors';
@import '@carbon/layout/scss/spacing';
@import '@carbon/type/scss/type';
// @import '@carbon/grid/scss/grid';

// ... other styles ...
```

Note: For `lg` devices, the number of columns went from 16 columns (as expected) to 12 columns (ala Twitter's "Bootstrap"). This will bite you, every time...

REMEMBER: if you are using grids, import the `@carbon/grid/...` to get your grids to match the documentation.

Remove the comment from the `@import '@carbon/grid/...'` line and continue;

11. Now lets do something useful with our breakpoints. Lets change the columns widths on a break point basis. Lets have 2 columns on phones, 4 columns on tablets and 8 columns on everything else..

In `src/App.js`:

```jsx
const Card = ({ children }) => (
    <div className="bx--col-sm-2 bx--col-md-2 bx--col-lg-4 card">
        <div className="face">{children}</div>
    </div>
);
```

# Chapter 6 - Moving the UI the Style Sheet

1. In a perfect world, we would move as much of visualization of our UI into the .scss style sheets as we could. We shouldn't have it hard coded into our components. As a developer, do we really care how the cards get rendered in a grid on a certain device? No. We can use the SASS `@extend` directive to move those classes into the .scss file where they belong:

Edit the `.card` definition in `src/App.scss`:

```scss
.card {
    @extend .bx--col-sm-4;
    @extend .bx--col-md-2;
    @extend .bx--col-lg-4;
    @extend .bx--col-xlg-2;
    .face {
        border: 1px solid $carbon--blue-30;
        border-radius: 0.25rem;
        min-height: 100px;
        background-color: $carbon--blue-10;
        font-size: carbon--type-scale(4);
        padding: $spacing-02;
    }

    padding-bottom: $carbon--spacing-07;
}
```

2. remove the `bx--col-*` classes from our card in `src/App.js`:

```jsx
const Card = ({ children }) => (
    <div className="card">
        <div className="face">{children}</div>
    </div>
);
```

3. We are back where we started!

4. Go ahead and move the `bx--grid` and `bx--row` into the scss as well..

In `src/App.scss`:

```scss
.cards-container {
    @extend .bx--grid;
    margin-top: $carbon--spacing-08;
}

.cards {
    @extend .bx--row;
}
```

In `src/App.js`:

```xml
<div className="cards-container">
    <div className="cards">
        ... no other changes ...
    </div>
</div>
```

5. Sit Back and enjoy the glorious simplicity of our React Code!

# Chapter 7 - Iconography

1. Ok, colors, spacing, fonts, grids... now it's time for icons. This time we'll grab the React specific version `@carbon/icons-react`. You might be asking, didn't we already add some carbon icons to our app? Yes, you did but those were only the icons used by the components themselves, the `@carbon/icons-react` package has tons of other icons for you to use. Don't worry, only the icons you actually use will be included in your production build. Let's add that package to project now:

```bash
yarn add @carbon/icons-react
yarn run copy-scss
```

2. Icons can be imported directly into your app like any other other component:

At the top of `src/App.js`;

```jsx
import React, { Component } from 'react';
import './App.scss';
import Hearts from '@carbon/icons-react/es/favorite--filled/16';
```

3. Using icons, for the most part, is like using any other React component;

in `src/App.js`:

```jsx
const Card = ({ children }) => (
    <div className="card">
        <div className="face">
            {children} <Hearts />
        </div>
    </div>
);
```

And later in `src/App.js`:

```xml
<div className="cards">
    <Card>A</Card>
    <Card>2</Card>
    <Card>3</Card>
    ...
    <Card>J</Card>
    <Card>Q</Card>
    <Card>K</Card>
</div>
```

4. Changing an icon color require special handing. To demonstrate, let's import an icon and add it to our `page-title`:

Near the top of `src/App.js`:

```jsx
import BrandIcon from '@carbon/icons-react/es/chip/32';
```

Further down in `src/App.js` add the `BrandIcon`:

```jsx
<div className="App">
    <div className="page-header">
        <BrandIcon /> Hello, Carbon!
    </div>
    // ... no other changes ...
</div>
```

5. Oh noes! The icon is the wrong color - we need to change it's `fill` color:

In `src/App.scss` change the `.page-header` style to:

```scss
.page-header {
    padding-top: $carbon--spacing-10;
    padding-bottom: $carbon--spacing-05;
    padding-left: $carbon--spacing-05;
    background-color: $carbon--blue-70;
    color: $carbon--white-0;
    @include properties($heading-01);
    font-size: carbon--type-scale(10);
    // fill any <svg> inside of a .page-header
    svg {
        fill: $carbon--blue-10;
    }
}
```

Wow! Our app is starting to look like an actual app..

# Chapter 8 - Using Carbon Components

1. Finally, we can add some actual Carbon COMPONENTS to our app! Components need to be imported before they can be used. Lets add a styled `<Button>` as an example:

near the top of `src/App.js`:

```jsx
// ... after other imports ...

import Button from 'carbon-components-react/es/components/Button';

const handleShuffle = () => {
    alert('shuffling cards! (not really)');
};
```

2. use the Button in our UI:

near the bottom of `src/Index.js` before the last `</div>`:

```xml
<button className="shuffle-cards" onClick="{handleShuffle}">
    Shuffle
</button>
```

3. Style the button like a normal component

at the bottom of `src/App.scss`:

```scss
.shuffle-cards {
    margin-left: $carbon--spacing-07;
}
```

4. To add an icon to the button, first import the icon and pass it into the button via the renderIcon property. Size doesn't seem to matter for the button icons, so choose the smallest version of the icon you can find.

at the top of `src/App.js`:

```jsx
// ... after other imports ...

import ShuffleIcon from '@carbon/icons-react/es/shuffle/20';
```

near the end of `src/App.js`:

```xml
<Button
    className="shuffle-cards"
    onClick={handleShuffle}
    renderIcon={ShuffleIcon}
    iconDescription="two arrows, crossing in the middle"
>
    Shuffle
</Button>
```

Note: this is our first "interactive" component, so we should take a minute to talk about accessibility. You should also add "aria" descriptions when using icons...

# Chapter 9 - Adding the Experimental UI Shell

1. Enable the experimental features of Carbon.

change `src/index.scss` to:

```scss
$feature-flags: (
    components-x: true,
    ui-shell: true,
);

@import 'carbon-components/scss/globals/scss/styles.scss';
```

# Chapter 10 - Building and pushing the app to IBM cloud.

1. Clean up the app for deployment.

-   Update `public/favicon.ico` to use your own (or IBM's) icon.
-   Update `public/index.html` to use your app's page title.
-   Update `public/manifest.json` to contain info about this app.

2. create a bluemix manifest file for hosting static assets via NGINX:

create `manifest.yml`:

```yaml
---
applications:
    - buildpack: https://github.com/cloudfoundry/staticfile-buildpack.git
      memory: 64M
      stack: cflinuxfs2
      path: build
      name: my-app-name
      routes:
          - route: my-app-name.mybluemix.net
```

3. Create a yarn script to publish the site to bluemix:

extracted from `package.json`:

```json
{
    "scripts": {
        "push-it": "rm -rf ./build && react-scripts build && ibmcloud cf push"
    }
}
```

4. Run the script and check out the site running on `mybluemix.net`.

# Congratulations - You Made It To The End!

Let's Recap:

```scss
//
// 1.  create .env for easy @imports
//
SASS_PATH="node_modules"

//
// 2.  use @include for Plex fonts and stuff
//
.page-header {
    @include properties($header-01);
}

//
// 3.  use @extend to embed carbon styles in your app style (don’t hard code grids)
//
.my-component {
    @extend .bx--col-sm-4;
    @extend .bx--col-md-2;
}
```

# Credits

-   [elowry/carbon-v10-tips](https://github.ibm.com/elowry/carbon-v10-tips) for the initial platform that [nicholasadamou/carbon-kickstarter](https://github.com/nicholasadamou/carbon-kickstarter) was built on.
