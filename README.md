# alpha-scripts
This is a fork of ```react-scripts``` with some modifications that can toggle extra features.
## USE
### Install
Install with npm:

```
npm install --save-dev alpha-scripts
```

Install with yarn:
```
yarn add alpha-scripts --dev
```
### Run
Runs the app in development mode:

```
alpha-scripts start
```

Builds the app for production to the build folder:

```
alpha-scripts build
```

You can also config the "scripts" property of the package.json file.

### Options

You can pass options using a configuration file `.alpharc.js` in the root directory and export an object containing your configuration.

#### `eslintrc` (default: false)

This option will enable eslint using configuration defined in `.eslintrc.*` files.

#### `babelrc` (default: false)

This option will enable the use of `.babelrc` configuration files.

#### `modules`

add directories for webpack to resolve modules from, see [webpack resolve.modules](https://webpack.js.org/configuration/resolve/#resolve-modules)

```js
modules:['components']
```

#### `alias`

set resolve aliases, see [webpack resolve.alias](https://webpack.js.org/configuration/resolve/#resolve-alias)

#### `proxy`

[proxying API requests in development](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#proxying-api-requests-in-development)

#### `plugins`

allow additional webpack plugins. See [plugins page](https://webpack.js.org/configuration/plugins) for detail.

#### `mockOptions`
specify the options for mock data, [more](https://github.com/yoranfu/alpha-utils#usage)

#### `openPathname`
specify the default open pathname in development

```js
openPathname: '/homepage'
```

#### `theme`
override less variables via [less-loader modifyVars](https://github.com/webpack-contrib/less-loader#less-options)

```js
theme: {
  'primary-color': '#1DA57A',
},
```

#### `includePaths`
paths for babel-loader to resolve

#### `watchIgnored`
specify watch ignore files and/or directories [watchOptions.ignored](https://webpack.js.org/configuration/watch/#watchoptions-ignored)

Note:

If you want to override @icon-url, the value must be contained in quotes like "@icon-url": "'your-icon-font-path'". [A fix sample](https://github.com/vision8tech/dvajs-user-dashboard/pull/2).

---

## [License](LICENSE)
