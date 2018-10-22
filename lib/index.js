var _ = require('lodash'),
xml = require('xmlbuilder'),
JunitFullReporter;

function getFullName (item, separator) {
    if (_.isEmpty(item) || !_.isFunction(item.parent) || !_.isFunction(item.forEachParent)) { return; }

    var chain = [];
    item.forEachParent(function (parent) { chain.unshift(parent.name || parent.id); });

    item.parent() && chain.push(item.name || item.id); // Add the current item only if it is not the collection
    return chain.join(_.isString(separator) ? separator : ' / ');
}

/**
 * A function that creates raw XML to be written to Newman JUnit reports.
 *
 * @param {Object} newman - The collection run object, with a event handler setter, used to enable event wise reporting.
 * @param {Object} reporterOptions - A set of JUnit reporter run options.
 * @param {String=} reporterOptions.export - Optional custom path to create the XML report at.
 * @returns {*}
 */
JunitFullReporter = function (newman, reporterOptions, options) {
    newman.on('beforeDone', function () {
        var report = _.get(newman, 'summary.run.executions'),
			collectionId = _.get(newman, 'summary.collection.id'),
            collectionName = _.get(newman, 'summary.collection.name'),
            root,
            testSuitesExecutionTime = 0,
            executionTime = 0;

        if (!report) {
            return;
        }

        root = xml.create('testsuites', { version: '1.0', encoding: 'UTF-8' });
        root.att('name', collectionName);
        root.att('tests', _.get(newman, 'summary.run.stats.tests.total', 'unknown'));

		_.forEach(report, function (execution) {
			var suite = root.ele('testsuite'),
                tests = {},
                errors = 0,
                failures = 0,
                errorMessages;
				
			suite.att('name', getFullName(execution.item));
            suite.att('id', execution.cursor.ref);
			
			var iteration = execution.cursor.iteration,
				errored,
				msg = `Iteration: ${iteration}\n`;

			// Process errors
			if (execution.requestError) {
				++errors;
				errored = true;
				msg += ('RequestError: ' + (execution.requestError.stack) + '\n');
			}
			msg += '\n---\n';
			_.forEach(['testScript', 'prerequestScript'], function (prop) {
				_.forEach(execution[prop], function (err) {
					if (err.error) {
						++errors;
						errored = true;
						msg = (msg + prop + 'Error: ' + (err.error.stack || err.error.message));
						msg += '\n---\n';
					}
				});
			});

			if (errored) {
				errorMessages = _.isString(errorMessages) ? (errorMessages + msg) : msg;
			}

			// Process assertions
			_.forEach(execution.assertions, function (assertion) {
				var name = assertion.assertion,
					err = assertion.error;

				if (err) {
					++failures;
					(_.isArray(tests[name]) ? tests[name].push(err) : (tests[name] = [err]));
				}
				else {
					tests[name] = [];
				}
			});
			if (execution.assertions) {
				suite.att('tests', execution.assertions.length);
			}
			else {
				suite.att('tests', 0);
			}

			suite.att('failures', failures);
			suite.att('errors', errors);

			suite.att('time', _.mean(_.map(report, function (execution) {
				executionTime = _.get(execution, 'response.responseTime') / 1000 || 0;
				testSuitesExecutionTime += executionTime;

				return executionTime;
			})).toFixed(3));
			errorMessages && suite.ele('error').dat(errorMessages);

			_.forOwn(tests, function (failures, name) {
				var testcase = suite.ele('testcase'),
					failure;

				testcase.att('name', name);
				testcase.att('time', executionTime.toFixed(3));
				if (failures && failures.length) {
					testcase.att('classname', _.get(testcase.up(), 'attributes.name.value',
						'JUnitXmlReporter.constructor'));

					failure = testcase.ele('failure');
					failure.att('type', 'AssertionFailure');
					failure.dat('Failed ' + failures.length + ' times.');
					failure.dat('Collection JSON ID: ' + collectionId + '.');
					failure.dat('Collection name: ' + collectionName + '.');
					failure.dat('Request name: ' + getFullName(execution.item) + '.');
					failure.dat('Test description: ' + name + '.');
					if (failures.length !== 0) {
						failure.dat('Error message: ' + failures[0].message + '.');
						failure.dat('Stacktrace: ' + failures[0].stack + '.');
					}
				}
			});
		});

        root.att('time', testSuitesExecutionTime.toFixed(3));
        newman.exports.push({
            name: 'junit-reporter-full',
            default: 'newman-run-report-full.xml',
            path: reporterOptions.export,
            content: root.end({
                pretty: true,
                indent: '  ',
                newline: '\n',
                allowEmpty: false
            })
        });
    });
};

module.exports = JunitFullReporter;