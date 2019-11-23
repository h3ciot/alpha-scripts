/**
 * @author:lpf
 * @flow
 *
 **/
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const ManifestPlugin = require('webpack-manifest-plugin');
const InjectGitInfoPlugin = require('./InjectGitInfoPlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const paths = require('./paths');
const getClientEnvironment = require('./env');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');
const postcssNormalize = require('postcss-normalize');
const HappyPack = require('happypack');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length - 1 });
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
// alpharc配置
const alpharc = fs.existsSync(paths.alpharc) && require(paths.alpharc) || {};

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

const imageInlineSizeLimit = parseInt(
    process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);

// style files regexes
const cssRegex = /\.css$/;
const lessRegex = /\.less$/;

// This is the base configuration
module.exports = function (webpackEnv) {
    const isEnvDevelopment = webpackEnv === 'development';
    const isEnvProduction = webpackEnv === 'production';

    // Webpack uses `publicPath` to determine where the app is being served from.
    // It requires a trailing slash, or the file assets will get an incorrect path.
    // In development, we always serve from the root. This makes config easier.
    const publicPath = isEnvProduction
        ? paths.servedPath
        : isEnvDevelopment && '/';

    // `publicUrl` is just like `publicPath`, but we will provide it to our app
    // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
    // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
    const publicUrl = isEnvProduction
        ? publicPath.slice(0, -1)
        : isEnvDevelopment && '';

    // Get environment variables to inject into our app.
    const env = getClientEnvironment(publicUrl);

    // Some apps do not use client-side routing with pushState.
    // For these, "homepage" can be set to "." to enable relative asset paths.
    const shouldUseRelativeAssetPaths = publicPath === './';

    // common function to get style loaders
    const getStyleLoaders = (cssOptions, preProcessor, preProcessorOption) => {
        const loaders = [
            isEnvDevelopment && require.resolve('style-loader'),
            isEnvProduction && {
                loader: MiniCssExtractPlugin.loader,
                options: shouldUseRelativeAssetPaths ? { publicPath: '../../' } : {},
            },
            {
                loader: require.resolve('css-loader'),
                options: cssOptions,
            },
            {
                // Options for PostCSS as we reference these options twice
                // Adds vendor prefixing based on your specified browser support in
                // package.json
                loader: require.resolve('postcss-loader'),
                options: {
                    // Necessary for external CSS imports to work
                    // https://github.com/facebook/create-react-app/issues/2677
                    ident: 'postcss',
                    plugins: () => [
                        require('postcss-flexbugs-fixes'),
                        require('postcss-preset-env')({
                            autoprefixer: {
                                flexbox: 'no-2009',
                            },
                            stage: 3,
                        }),
                        // Adds PostCSS Normalize as the reset css with default options,
                        // so that it honors browserslist config in package.json
                        // which in turn let's users customize the target behavior as per their needs.
                        postcssNormalize(),
                    ],
                    sourceMap: isEnvProduction && shouldUseSourceMap,
                },
            },
        ].filter(Boolean);
        if (preProcessor) {
            loaders.push({
                loader: require.resolve(preProcessor),
                options: Object.assign({
                    sourceMap: isEnvProduction && shouldUseSourceMap,
                }, preProcessorOption || {}),
            });
        }
        return loaders;
    };
    return {
        mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
        // Stop compilation early in production
        bail: isEnvProduction,
        devtool: isEnvProduction
            ? shouldUseSourceMap
                ? 'cheap-module-source-map'
                : false
            : isEnvDevelopment && 'source-map',
        // These are the "entry points" to our application.
        // This means they will be the "root" imports that are included in JS bundle.
        entry: [
            // Include an alternative client for WebpackDevServer. A client's job is to
            // connect to WebpackDevServer by a socket and get notified about changes.
            // When you save a file, the client will either apply hot updates (in case
            // of CSS changes), or refresh the page (in case of JS changes). When you
            // make a syntax error, this client will display a syntax error overlay.
            // Note: instead of the default WebpackDevServer client, we use a custom one
            // to bring better experience for Create React App users. You can replace
            // the line below with these two lines if you prefer the stock client:
            // require.resolve('webpack-dev-server/client') + '?/',
            // require.resolve('webpack/hot/dev-server'),
            isEnvDevelopment &&
            require.resolve('react-dev-utils/webpackHotDevClient'),
            // add polyfills, dev and production all
            require.resolve('./polyfills'),
            // Finally, this is your app's code:
            paths.appIndexJs,
            // We include the app code last so that if there is a runtime error during
            // initialization, it doesn't blow up the WebpackDevServer client, and
            // changing JS code would still trigger a refresh.
        ].filter(Boolean),
        output: {
            // The build folder.
            path: isEnvProduction ? paths.appBuild : undefined,
            // Add /* filename */ comments to generated require()s in the output.
            pathinfo: isEnvDevelopment,
            // There will be one main bundle, and one file per asynchronous chunk.
            // In development, it does not produce real files.
            filename: isEnvProduction
                ? 'static/js/[name].[contenthash:8].js'
                : isEnvDevelopment && 'static/js/bundle.js',
            // TODO: remove this when upgrading to webpack 5
            futureEmitAssets: true,
            // There are also additional JS chunk files if you use code splitting.
            chunkFilename: isEnvProduction
                ? 'static/js/[name].[contenthash:8].chunk.js'
                : isEnvDevelopment && 'static/js/[name].chunk.js',
            // We inferred the "public path" (such as / or /my-project) from homepage.
            // We use "/" in development.
            publicPath: publicPath,
            // Point sourcemap entries to original disk location (format as URL on Windows)
            devtoolModuleFilenameTemplate: isEnvProduction
                ? info =>
                    path
                        .relative(paths.appSrc, info.absoluteResourcePath)
                        .replace(/\\/g, '/')
                : isEnvDevelopment &&
                (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
            globalObject: isEnvDevelopment ? "this" : undefined,
        },
        optimization: {
            minimize: isEnvProduction,
            minimizer: [
                // This is only used in production mode
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            // we want terser to parse ecma 8 code. However, we don't want it
                            // to apply any minfication steps that turns valid ecma 5 code
                            // into invalid ecma 5 code. This is why the 'compress' and 'output'
                            // sections only apply transformations that are ecma 5 safe
                            // https://github.com/facebook/create-react-app/pull/4234
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            // Disabled because of an issue with Uglify breaking seemingly valid code:
                            // https://github.com/facebook/create-react-app/issues/2376
                            // Pending further investigation:
                            // https://github.com/mishoo/UglifyJS2/issues/2011
                            comparisons: false,
                            // Disabled because of an issue with Terser breaking valid code:
                            // https://github.com/facebook/create-react-app/issues/5250
                            // Pending futher investigation:
                            // https://github.com/terser-js/terser/issues/120
                            inline: 2,
                        },
                        mangle: {
                            safari10: true,
                        },
                        output: {
                            ecma: 5,
                            comments: false,
                            // Turned on because emoji and regex is not minified properly using default
                            // https://github.com/facebook/create-react-app/issues/2488
                            ascii_only: true,
                        },
                    },
                    // Use multi-process parallel running to improve the build speed
                    // Default number of concurrent runs: os.cpus().length - 1
                    // Disabled on WSL (Windows Subsystem for Linux) due to an issue with Terser
                    // https://github.com/webpack-contrib/terser-webpack-plugin/issues/21
                    // 1.3.0 default disabled parallel when in wsl model
                    // 1.3.0 版本默认禁用并行压缩当处于windows下的bash客户端时
                    parallel: true,
                    // Enable file caching
                    cache: true,
                    sourceMap: shouldUseSourceMap,
                }),
                // This is only used in production mode
                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        parser: safePostCssParser,
                        map: shouldUseSourceMap
                            ? {
                                // `inline: false` forces the sourcemap to be output into a
                                // separate file
                                inline: false,
                                // `annotation: true` appends the sourceMappingURL to the end of
                                // the css file, helping the browser find the sourcemap
                                annotation: true,
                            }
                            : false,
                        // 避免unicode-range的乱码问题
                        normalizeUnicode: false,
                        // 打印处理过程日志
                        canPrint: true,
                    },
                }),
            ],
            // Automatically split vendor and commons
            // https://twitter.com/wSokra/status/969633336732905474
            // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
            splitChunks: {
                chunks: 'all',
                name: false,
                minSize: 30000,
            },
            // Keep the runtime chunk separated to enable long term caching
            // https://twitter.com/wSokra/status/969679223278505985
            runtimeChunk: true,
        },
        resolve: {
            // This allows you to set a fallback for where Webpack should look for modules.
            // We placed these paths second because we want `node_modules` to "win"
            // if there are any conflicts. This matches Node resolution mechanism.
            // https://github.com/facebook/create-react-app/issues/253
            modules: [alpharc.modules, paths.appNodeModules, 'node_modules', path.resolve(paths.appNodeModules, '../../../node_modules')].concat(process.env.NODE_PATH.split(path.delimiter)).filter(Boolean),
            // These are the reasonable defaults supported by the Node ecosystem.
            // We also include JSX as a common component filename extension to support
            // some tools, although we do not recommend using it, see:
            // https://github.com/facebook/create-react-app/issues/290
            // `web` extension prefixes have been added for better support
            // for React Native Web.
            extensions: ['.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx'],
            alias: Object.assign(
                {
                    // Support React Native Web
                    // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
                    'react-native': 'react-native-web',
                },
                alpharc.alias
            ),
            plugins: [
                // Prevents users from importing files from outside of src/ (or node_modules/).
                // This often causes confusion because we only process files within src/ with babel.
                // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
                // please link the files into your node_modules/ and let module-resolution kick in.
                // Make sure your source files are compiled, as they will not be processed in any way.
                new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
            ],
            // 移除链接解析
            symlinks: false,
        },
        module: {
            strictExportPresence: true,
            rules: [
                // Disable require.ensure as it's not a standard language feature.
                { parser: { requireEnsure: false } },

                // First, run the linter.
                // It's important to do this before Babel processes the JS.
                {
                    test: /\.(js|mjs|jsx)$/,
                    enforce: 'pre',
                    use: 'happypack/loader?id=eslint',
                    // use: [
                    //     {
                    //         options: Object.assign(
                    //             {
                    //                 formatter: require.resolve('react-dev-utils/eslintFormatter'),
                    //                 eslintPath: require.resolve('eslint'),
                    //                 presets: ["react-app"],
                    //             },
                    //             alpharc.eslintrc ? {
                    //                 useEslintrc: true,
                    //                 configFile: path.resolve(path.resolve(paths.appPath, '../../.eslintrc.json')),
                    //             } : {
                    //                 baseConfig: {
                    //                     extends: [require.resolve('eslint-config-react-app')],
                    //                 },
                    //                 ignore: false,
                    //                 useEslintrc: false,
                    //             }
                    //         ),
                    //         loader: require.resolve('eslint-loader'),
                    //     },
                    // ],
                    include: [paths.appSrc, alpharc.includePaths].filter(Boolean),
                },
                {
                  test: /\.worker\.js$/,
                  loader: require.resolve('worker-loader'),
                  exclude: /node_modules/
                },
                {
                    // "oneOf" will traverse all following loaders until one will
                    // match the requirements. When no loader matches it will fall
                    // back to the "file" loader at the end of the loader list.
                    oneOf: [
                        // "url" loader works like "file" loader except that it embeds assets
                        // smaller than specified limit in bytes as data URLs to avoid requests.
                        // A missing `test` is equivalent to a match.
                        // TODO happypack not support buffer, wait update
                        //TODO happypack 对二进制的文件处理存在问题，需要等待更新
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            // use: 'happypack/loader?id=url',
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: imageInlineSizeLimit,
                                name: 'static/media/[name].[hash:8].[ext]',
                            },
                        },
                        // Process application JS with Babel.
                        // The preset includes JSX, Flow, TypeScript, and some ESnext features.
                        {
                            test: /\.(js|jsx|mjs)$/,
                            include: [paths.appSrc, alpharc.includePaths].filter(Boolean),
                            use: 'happypack/loader?id=babel',
                            // loader: require.resolve('babel-loader'),
                            // options: {
                            //     customize: require.resolve(
                            //         'babel-preset-react-app/webpack-overrides'
                            //     ),
                            //     // babelrc: false,
                            //     // configFile: false,
                            //     presets: [[require.resolve('babel-preset-react-app'), { flow: true, typescript: false }]],
                            //     plugins: [
                            //         [
                            //             require.resolve('babel-plugin-named-asset-import'),
                            //             {
                            //                 loaderMap: {
                            //                     svg: {
                            //                         ReactComponent: '@svgr/webpack?-svgo,+ref![path]',
                            //                     },
                            //                 },
                            //             },
                            //         ]
                            //     ],
                            //     // This is a feature of `babel-loader` for webpack (not Babel itself).
                            //     // It enables caching results in ./node_modules/.cache/babel-loader/
                            //     // directory for faster rebuilds.
                            //     cacheDirectory: true,
                            //     cacheCompression: isEnvProduction,
                            //     compact: isEnvProduction,
                            // },
                        },
                        // Process any JS outside of the app with Babel.
                        // Unlike the application JS, we only compile the standard ES features.
                        {
                            test: /\.(js|mjs)$/,
                            exclude: /@babel(?:\/|\\{1,2})runtime/,
                            use: 'happypack/loader?id=babelRuntime',
                        },
                        // "postcss" loader applies autoprefixer to our CSS.
                        // "css" loader resolves paths in CSS and adds assets as dependencies.
                        // "style" loader turns CSS into JS modules that inject <style> tags.
                        // In production, we use MiniCSSExtractPlugin to extract that CSS
                        // to a file, but in development "style" loader enables hot editing
                        // of CSS.
                        {
                            test: cssRegex,
                            // use: 'happypack/loader?id=css',
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: isEnvProduction && shouldUseSourceMap,
                            }),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // add less config
                        {
                            test: lessRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 2,
                                    sourceMap: isEnvProduction && shouldUseSourceMap
                                },
                                'less-loader',
                                { javascriptEnabled: true, modifyVars: alpharc.theme || {}, }
                            ),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // "file" loader makes sure those assets get served by WebpackDevServer.
                        // When you `import` an asset, you get its (virtual) filename.
                        // In production, they would get copied to the `build` folder.
                        // This loader doesn't use a "test" so it will catch all modules
                        // that fall through the other loaders.
                        {
                            // Exclude `js` files to keep "css" loader working as it injects
                            // its runtime that would otherwise be processed through "file" loader.
                            // Also exclude `html` and `json` extensions so they get processed
                            // by webpacks internal loaders.
                            exclude: [/\.(js|mjs|jsx)$/, /\.html$/, /\.json$/],
                            use: 'happypack/loader?id=file',
                        },
                        // ** STOP ** Are you adding a new loader?
                        // Make sure to add the new loader(s) before the "file" loader.
                    ],
                },
            ],
        },
        plugins: merge({ plugins: [
                // add happypack
                new HappyPack({
                    id: 'eslint',
                    threadPool: happyThreadPool,
                    loaders: [
                        {
                            options: Object.assign(
                                {
                                    formatter: require.resolve('react-dev-utils/eslintFormatter'),
                                    eslintPath: require.resolve('eslint'),
                                    presets: ["react-app"],
                                },
                                alpharc.eslintrc ? {
                                    useEslintrc: true,
                                    configFile: alpharc.eslintConfigPath,
                                } : {
                                    baseConfig: {
                                        extends: [require.resolve('eslint-config-react-app')],
                                    },
                                    ignore: false,
                                    useEslintrc: false,
                                }
                            ),
                            loader: require.resolve('eslint-loader'),
                        }],
                }),
                new HappyPack({
                    id: 'babel',
                    threadPool: happyThreadPool,
                    loaders: [{
                        loader: require.resolve('babel-loader'),
                        options: {
                            customize: require.resolve(
                                'babel-preset-react-app/webpack-overrides'
                            ),
                            // babelrc: false,
                            // configFile: false,
                            presets: [[require.resolve('babel-preset-react-app'), { flow: true, typescript: false }]],
                            plugins: [
                                [
                                    require.resolve('babel-plugin-named-asset-import'),
                                    {
                                        loaderMap: {
                                            svg: {
                                                ReactComponent: '@svgr/webpack?-svgo,+ref![path]',
                                            },
                                        },
                                    },
                                ]
                            ],
                            // This is a feature of `babel-loader` for webpack (not Babel itself).
                            // It enables caching results in ./node_modules/.cache/babel-loader/
                            // directory for faster rebuilds.
                            cacheDirectory: true,
                            cacheCompression: isEnvProduction,
                            compact: isEnvProduction,
                        },
                    }]
                }),
                new HappyPack({
                    id: 'babelRuntime',
                    threadPool: happyThreadPool,
                    loaders: [{
                        loader: require.resolve('babel-loader'),
                        options: {
                            babelrc: false,
                            configFile: false,
                            compact: false,
                            presets: [
                                [
                                    require.resolve('babel-preset-react-app/dependencies'),
                                    { helpers: true },
                                ],
                            ],
                            cacheDirectory: true,
                            cacheCompression: isEnvProduction,
                            cacheIdentifier: getCacheIdentifier(
                                isEnvProduction
                                    ? 'production'
                                    : isEnvDevelopment && 'development',
                                [
                                    'babel-plugin-named-asset-import',
                                    'babel-preset-react-app',
                                    'react-dev-utils',
                                    'react-scripts',
                                ]
                            ),
                            // If an error happens in a package, it's possible to be
                            // because it was compiled. Thus, we don't want the browser
                            // debugger to show the original code. Instead, the code
                            // being evaluated would be much more helpful.
                            sourceMaps: false,
                        },
                    }]
                }),
                // new HappyPack({
                //   id: 'url',
                //   threadPool: happyThreadPool,
                //   loaders: [{
                //     loader: require.resolve('url-loader'),
                //     options: {
                //         limit: imageInlineSizeLimit,
                //         name: 'static/media/[name].[hash:8].[ext]',
                //     },
                //   }]
                // }),
                new HappyPack({
                    id: 'file',
                    threadPool: happyThreadPool,
                    loaders: [{
                        loader: require.resolve('file-loader'),
                        options: {
                            name: 'static/media/[name].[hash:8].[ext]',
                        },
                    }]
                }),
                // Generates an `index.html` file with the <script> injected.
                new HtmlWebpackPlugin(
                    Object.assign(
                        {},
                        {
                            inject: true,
                            template: paths.appHtml,
                        },
                        isEnvProduction
                            ? {
                                minify: {
                                    removeComments: true,
                                    collapseWhitespace: true,
                                    removeRedundantAttributes: true,
                                    useShortDoctype: true,
                                    removeEmptyAttributes: true,
                                    removeStyleLinkTypeAttributes: true,
                                    keepClosingSlash: true,
                                    minifyJS: true,
                                    minifyCSS: true,
                                    minifyURLs: true,
                                },
                            }
                            : undefined
                    )
                ),
                // Inlines the webpack runtime script. This script is too small to warrant
                // a network request.
                isEnvProduction &&
                shouldInlineRuntimeChunk &&
                new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
                // Makes some environment variables available in index.html.
                // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
                // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
                // In production, it will be an empty string unless you specify "homepage"
                // in `package.json`, in which case it will be the pathname of that URL.
                // In development, this will be an empty string.
                new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
                // This gives some necessary context to module not found errors, such as
                // the requesting resource.
                new ModuleNotFoundPlugin(paths.appPath),
                // Makes some environment variables available to the JS code, for example:
                // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
                // It is absolutely essential that NODE_ENV is set to production
                // during a production build.
                // Otherwise React will be compiled in the very slow development mode.
                new webpack.DefinePlugin(env.stringified),
                // This is necessary to emit hot updates (currently CSS only):
                isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
                // Watcher doesn't work well if you mistype casing in a path so we use
                // a plugin that prints an error when you attempt to do this.
                // See https://github.com/facebook/create-react-app/issues/240
                isEnvDevelopment && new CaseSensitivePathsPlugin(),
                // If you require a missing module and then `npm install` it, you still have
                // to restart the development server for Webpack to discover it. This plugin
                // makes the discovery automatic so you don't have to restart.
                // See https://github.com/facebook/create-react-app/issues/186
                isEnvDevelopment &&
                new WatchMissingNodeModulesPlugin(paths.appNodeModules),
                isEnvProduction &&
                new MiniCssExtractPlugin({
                    // Options similar to the same options in webpackOptions.output
                    // both options are optional
                    filename: 'static/css/[name].[contenthash:8].css',
                    chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
                }),
                // Generate a manifest file which contains a mapping of all asset filenames
                // to their corresponding output file so that tools can pick it up without
                // having to parse `index.html`.
                new ManifestPlugin({
                    fileName: 'asset-manifest.json',
                    publicPath: publicPath,
                    generate: (seed, files) => {
                        const manifestFiles = files.reduce(function(manifest, file) {
                            manifest[file.name] = file.path;
                            return manifest;
                        }, seed);

                        return {
                            files: manifestFiles,
                        };
                    },
                }),
                // Moment.js is an extremely popular library that bundles large locale files
                // by default due to how Webpack interprets its code. This is a practical
                // solution that requires the user to opt into importing specific locales.
                // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
                // You can remove this if you don't use Moment.js:
                new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
                // Generate a service worker script that will precache, and keep up to date,
                // the HTML & assets that are part of the Webpack build.
                isEnvProduction &&
                new SWPrecacheWebpackPlugin({
                    // By default, a cache-busting query parameter is appended to requests
                    // used to populate the caches, to ensure the responses are fresh.
                    // If a URL is already hashed by Webpack, then there is no concern
                    // about it being stale, and the cache-busting can be skipped.
                    dontCacheBustUrlsMatching: /\.\w{8}\./,
                    filename: 'service-worker.js',
                    logger(message) {
                        if (message.indexOf('Total precache size is') === 0) {
                            // This message occurs for every build and is a bit too noisy.
                            return;
                        }
                        if (message.indexOf('Skipping static resource') === 0) {
                            // This message obscures real errors so we ignore it.
                            // https://github.com/facebookincubator/create-react-app/issues/2612
                            return;
                        }
                        console.log(message);
                    },
                    minify: true,
                    // For unknown URLs, fallback to the index page
                    navigateFallback: publicUrl + '/index.html',
                    // Ignores URLs starting from /__ (useful for Firebase):
                    // https://github.com/facebookincubator/create-react-app/issues/2237#issuecomment-302693219
                    navigateFallbackWhitelist: [/^(?!\/__).*/],
                    // Don't precache sourcemaps (they're large) and build asset manifest:
                    // ignore index.html (always get the index.html from server)
                    staticFileGlobsIgnorePatterns: [/index\.html$/, /\.map$/, /asset-manifest\.json$/],
                }),
                // add webpack analyzer
                isEnvProduction && alpharc.analyzer && new BundleAnalyzerPlugin(
                    {
                        analyzerMode: 'server',
                        analyzerHost: '127.0.0.1',
                        analyzerPort: 1234,
                        openAnalyzer: true,
                    }
                ),
                //   add progress
                new ProgressBarPlugin(),
                isEnvProduction && new InjectGitInfoPlugin({ workPath: path.resolve(paths.appPath, '../../')}),
                // add cache
                isEnvProduction && new HardSourceWebpackPlugin(),
            ].filter(Boolean) }, { plugins: alpharc.plugins }).plugins,
        // Some libraries import Node modules but don't use them in the browser.
        // Tell Webpack to provide empty mocks for them so importing them works.
        node: {
            module: 'empty',
            dgram: 'empty',
            dns: 'mock',
            fs: 'empty',
            http2: 'empty',
            net: 'empty',
            tls: 'empty',
            child_process: 'empty',
        },
        // Turn off performance processing because we utilize
        // our own hints via the FileSizeReporter
        performance: false,
    };
};
