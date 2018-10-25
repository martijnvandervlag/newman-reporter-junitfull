# newman-reporter-junitfull
JUnit reporter for [Newman](https://github.com/postmanlabs/newman) that provides the information about the collection run in JUnit format.
This needs to be used in [conjunction with Newman](https://github.com/postmanlabs/newman#external-reporters) so that it can recognize JUnit reporting options.

> JUnit Reporter based on [XSD](https://github.com/windyroad/JUnit-Schema/blob/master/JUnit.xsd) specified by [Publish Test Results task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/test/publish-test-results?view=vsts&tabs=yaml) for Azure Pipeline | TFS 2018 | TFS 2017 | TFS 2015

> Different from [newman-reporter-junit](https://github.com/postmanlabs/newman/blob/develop/lib/reporters/junit/index.js) is using executions to have full report and no aggregated report.
Please use [newman-reporter-junit](https://github.com/postmanlabs/newman/blob/develop/lib/reporters/junit/index.js) if you want the original aggregated results.

## Install
> The installation should be global if newman is installed globally, local otherwise. (Replace -g from the command below with -S for a local installation)

```console
$ npm install -g newman-reporter-junitfull
```

## Usage
The examples provided in the usage are for showing the differences between [newman-reporter-junit](https://github.com/postmanlabs/newman/blob/develop/lib/reporters/junit/index.js) and this project.

Iteration (```-n 2```) is used to show the difference between original and full reports.

JUnit examples can be found [here](https://github.com/martijnvandervlag/newman-reporter-junitfull/tree/master/examples).

### Original
> Use [newman-reporter-junit](https://github.com/postmanlabs/newman/blob/develop/lib/reporters/junit/index.js) to execute.

In order to enable this reporter, specify `junit` in Newman's `-r` or `--reporters` option.

```console
newman run https://www.getpostman.com/collections/631643-f695cab7-6878-eb55-7943-ad88e1ccfd65-JsLv -r junit --reporter-junit-export './examples/original/result.xml' -n 2
```

### Full

In order to enable this reporter, specify `junitfull` in Newman's `-r` or `--reporters` option.

```console
newman run https://www.getpostman.com/collections/631643-f695cab7-6878-eb55-7943-ad88e1ccfd65-JsLv -r junitfull --reporter-junitfull-export './examples/full/result.xml' -n 2
```

### Options

#### With Newman CLI

| CLI Option  | Description       |
|-------------|-------------------|
| `--reporter-junitfull-export <path>` | Specify a path where the output XML file will be written to disk. If not specified, the file will be written to `newman/` in the current working directory. |

#### With Newman as a Library
The CLI functionality is available for programmatic use as well.

```javascript
const newman = require('newman');

newman.run({
    collection: require('https://www.getpostman.com/collections/631643-f695cab7-6878-eb55-7943-ad88e1ccfd65-JsLv'), // can also provide a URL or path to a local JSON file.
    reporters: 'junitfull',
    reporter: {
        junitfull: {
            export: './examples/full/result.xml', // If not specified, the file will be written to `newman/` in the current working directory.
        }
    },
	iterationCount: 2
}, function (err) {
	if (err) { throw err; }
    console.log('collection run complete!');
});
```

## Compatibility

| **newman-reporter-junitfull** | **newman** | **node** |
|:-----------------------------:|:----------:|:--------:|
|            v1.0.0             | >= v4.0.0  | >= v6.x  |
|            v1.1.0             | >= v4.0.0  | >= v6.x  |

## Troubleshooting

### Reporter not found
The reporter and newman must be installed at the same level, the installation should be global if newman is installed globally, local otherwise.

### Getting different JUnit output
You are most probably getting in-built reporter output used in older versions of newman, Please check the newman's [compatibility](#compatibility) section above.

> If you are facing any other problem, please check the open [issues](https://github.com/martijnvandervlag/newman-reporter-junitfull/issues) or create new.

## Community Support

<img src="https://avatars1.githubusercontent.com/u/3220138?v=3&s=120" align="right" />
If you are interested in talking to the Postman team and fellow Newman users, you can find us on our <a href="https://community.getpostman.com">Postman Community Forum</a>. Feel free to drop by and say hello. You'll find us posting about upcoming features and beta releases, answering technical support questions, and contemplating world peace.

Sign in using your Postman account to participate in the discussions and don't forget to take advantage of the <a href="https://community.getpostman.com/search?q=newman">search bar</a> - the answer to your question might already be waiting for you! Don’t want to log in? Then lurk on the sidelines and absorb all the knowledge.


## License
This software is licensed under Apache-2.0. Copyright Postdot Technologies, Inc. See the [LICENSE](LICENSE) file for more information.