# Migrating from 1.x to 2.0.0
### 依赖包升级如下：

| 升级前 | 升级后 |
| --- | --- |
| autoprefixer:7.1.6 | 移除，使用postcss-preset-env内置 |
| babel-core:6.26.0 | @babel/core:7.4.3 |
| babel-eslint:7.2.3 | babel-eslint:10.0.1 |
| babel-jest:20.0.3 | babel-jest:^24.8.0 |
| babel-loader:7.1.2 | bable-loader:8.0.5  |
| babel-preset-react-app:3.1.1 | babel-preset-react-app:^9.0.0  |
| case-sensitive-paths-webpack-plugin:2.1.1 | case-sensitive-paths-webpack-plugin:2.2.0 |
| chalk:1.1.3 | chalk:2.4.2 |
| css-loader:0.28.7 | css-loader:2.1.1 |
| dotenv:4.0.0 | dotenv:6.2.0 |
| dotenv-expand:4.2.0 | dotenv-expand:4.2.0 |
| eslint:4.10.0 | eslint:^5.16.0 |
| eslint-config-react-app:^2.1.0 | eslint-config-react-app:^4.0.1 |
| eslint-loader:1.9.0 | eslint-loader:2.1.2 |
| eslint-plugin-flowtype:2.39.1 | eslint-plugin-flowtype:2.50.1 |
| eslint-plugin-import:2.8.0 | eslint-plugin-import:2.16.0 |
| eslint-plugin-jsx-a11y:5.1.1 | eslint-plugin-jsx-a11y:6.2.1 |
| eslint-plugin-react: 7.4.0 | eslint-plugin-react:7.12.4 |
| extract-text-webpack-plugin:3.0.2 | 移除，使用optimize-css-assets-webpack-plugin替代 |
| file-loader:1.1.5 | file-loader:3.0.1  |
| fs-extra:3.0.1  | fs-extra: 7.0.1 |
| html-webpack-plugin:2.29.0 | html-webpack-plugin:4.0.0-beta.5 |
| jest:20.0.4 | jest:24.7.1 |
| less:2.7.3 | less:3.9.0 |
| less-loader:4.0.5 | less-loader:5.0.0 |
| object-assign:4.1.1 | object-assign:4.1.1 |
| postcss-flexbugs-fixes:3.2.0 | postcss-flexbugs-fixes:4.1.0 |
| postcss-loader:2.0.8 | postcss-loader:3.0.0 |
| promise:8.0.1 | promise:8.0.3 |
| raf:3.4.0 | raf:3.4.1 |
| react-dev-utils:^5.0.1 | react-dev-utils:^9.0.1 |
| resolve:1.6.0 | resolve:1.10.0 |
| style-loader:0.19.0 | style-loader:0.23.1 |
| sw-precache-webpack-plugin:0.11.4 | sw-precache-webpack-plugin:0.11.5 |
| url-loader:0.6.2 | url-loader:1.1.2 |
| webpack:3.8.1 | webpack:4.35.0 |
| webpack-dev-serve:2.9.4 | webpack-dev-serve:3.2.1 |
| webpack-manifest-plugin:1.3.2 | webpack-manifest-plugin:2.0.4 |
| whatwg-fetch:2.0.3 | whatwg-fetch:3.0.0 |
新增包如下：

| 名字 | 版本 | 功能 |
| --- | --- | --- |
| @svgr/webpack | 4.1.0 | 可将svg文件作为react组件加载 |
| babel-plugin-named-asset-import | ^0.3.2 | 与@svgr/webpack配合使用 |
| eslint-config-prettier | 6.0.0 | eslintconfig，应更新至外部库中 |
| eslint-plugin-prettier | 3.1.0 | eslint预提交插件，应更新至外部库中 |
| mini-css-extract-plugin | 0.5.0 | css代码抽取 |
| optimize-css-assets-webpack-plugin | 5.0.1 | css代码压缩 |
| postcss-normalize | 7.0.1 | css样式归一化 |
| postcss-preset-env | 6.6.0 | postcss环境预设包 |
| postcss-safe-parser | 4.0.1 | postcss安全解析包 |
| progress-bar-webpack-plugin | ^1.12.1 | 显示打包进度 |
| terser-webpack-plugin | 1.3.0 | 代码压缩，替换ug模块 |
| webpack-bundle-analyzer | ^3.3.2 | 用于打包后的文件分析 |
| webpack-merge | ^4.2.1 | 用于合并配置 |
| happypack | ^5.0.1 | 用于loader多线程化 |
| hard-source-webpack-plugin | ^0.13.1 | 用于缓存中间结果 |

### 配置变更内容：
 - 1.开发与生产环境config合并，通过环境变量来区分
 - 2.css增加浏览器归一化样式，通过postcss引入
 - 3.sourceMao级别变更，开发环境使用source-map，生产环境使用cheap-module-source-map或者生产环境关闭source-map
 - 4.输出文件由chunkhash变更为contenthash
 - 5.代码压缩由ug插件变更为terser插件
 - 6.增加webpack runtimechunk
 - 7.增加模块引用检查
 - 8.增加模块缺失检查，使用WatchMissingNodeModulesPlugin插件
 - 9.增加happyPack插件，引入多线程编译，目前以下loader使用多线程编译：eslint，babel-loader,file-loader，剩余loader由于happyPack本身的问题不支持多线程化
 - 10.增加对alpharc.includePaths中包含的文件的eslint检查
 - 1.增加hard-source-webpack-plugin用于缓存编译结果，加快二次打包速度，目前不支持开发者模式
   

### 升级注意点：

1. autoprefixer迁入postcss后，需在package.json文件中增加bowers字段来配置目标浏览器
2. babel6升级至babel7以后，不识别exports.xx = x这种导出方法，需要进行适配，需修改项目i18n文件
3. css中不识别css模块写法，以下写法不识别:global(), :root()
4. babelrc中的preset与plugin需要同步进行升级至支持babel7版本，详见上述升级包

### 待优化点：
profill增加自动profill特性，根据使用到的特性进行自动填充

