var _ = require('lodash'),
xml = require('xmlbuilder'),
moment = require('moment'),
JunitFullReporter;

// JUnit Reporter based on XSD specified by Publish Test Results task for Azure Pipeline / TFS 2018 / TFS 2017 and TFS 2015
// Source: https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/test/publish-test-results?view=vsts&tabs=yaml
// XSD: https://github.com/windyroad/JUnit-Schema/blob/master/JUnit.xsd

const SEPARATOR = ' / ';

/**
 * Resolves the parent qualified name for the provided item
 *
 * @param {PostmanItem|PostmanItemGroup} item The item for which to resolve the full name
 * @param {?String} [separator=SEP] The separator symbol to join path name entries with
 * @returns {String} The full name of the provided item, including prepended parent item names
 * @private
 */
function getParentName (item, separator) {
    if (_.isEmpty(item) || !_.isFunction(item.parent) || !_.isFunction(item.forEachParent)) { 
		return; 
	}

    var chain = [];
	
    item.forEachParent(function (parent) { 
		chain.unshift(parent.name || parent.id); 
	});
	
    return chain.join(_.isString(separator) ? separator : SEPARATOR);
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
        var executions = _.get(newman, 'summary.run.executions'),
		globalValues = _.get(newman, 'summary.globals.values.members', []),
		environmentValues = _.get(newman, 'summary.environment.values.members', []);
		
		var date = moment(new Date()).local().format('YYYY-MM-DDTHH:mm:ss.SSS');

        if (!executions) {
            return;
        }

        global = xml.create('testsuites', { version: '1.0', encoding: 'UTF-8' });

		// Process executions (testsuites)
		_.forEach(executions, function (execution) {
			var testsuite = global.ele('testsuite');
			var failures = 0, errors = 0;
			var propertyValues = _.merge(environmentValues, globalValues);
				
            testsuite.att('id', (execution.cursor.iteration * execution.cursor.length) + execution.cursor.position);
			
			// Hostname
			var protocol = _.get(execution, 'request.url.protocol', 'https') + '://';
			var hostName = _.get(execution, 'request.url.host', 'localhost');
			
			testsuite.att('hostname', protocol + hostName.join('.'));
			
			// Package
			testsuite.att('package', getParentName(execution.item));
			
			// Name
			testsuite.att('name', execution.item.name);
			
			// Tests
			if (execution.assertions) {
				testsuite.att('tests', execution.assertions.length);
			}
			else {
				testsuite.att('tests', 0);
			}
			
			// Failures
			testsuite.att('failures', failures);
			
			// Errors
			testsuite.att('errors', errors);
			
			// Timestamp
			testsuite.att('timestamp', date);
			
			// Time
			testsuite.att('time', (_.get(execution, 'response.responseTime') / 1000 || 0).toFixed(3));
			
			// Timestamp (add time)
			date = moment(date).add(_.get(execution, 'response.responseTime'), 'ms').local().format('YYYY-MM-DDTHH:mm:ss.SSS');
			
			// Process properties
			if (propertyValues && propertyValues.length) {
				properties = testsuite.ele('properties');
			
				_.forEach(propertyValues, function (propertyItem) {
					var property = properties.ele('property');
					property.att('name', propertyItem.key);
					property.att('value', propertyItem.value);
				});
			}

			// Process assertions (testcases)
			_.forEach(['prerequestScript', 'assertions', 'testScript'], function (property) {
				_.forEach(execution[property], function (testExecution) {
					var testcase = testsuite.ele('testcase');
					
					// Classname
					var className = [];
					className.push(_.get(testcase.up(), 'attributes.package.value'));
					className.push(_.get(testcase.up(), 'attributes.name.value'));
					testcase.att('classname', className.join(SEPARATOR));
					
					if (property === 'assertions') {
						// Name
						testcase.att('name', testExecution.assertion);
						
						// Time (testsuite time divided by number of assertions)
						testcase.att('time', (_.get(testcase.up(), 'attributes.time.value') / execution.assertions.length || 0).toFixed(3));
					
					} else {
						// Name
						testcase.att('name', property === 'testScript' ? 'Tests' : 'Pre-request Script');
					}
					
					// Errors / Failures
					var errorItem = testExecution.error;
					if (errorItem) {
						var result;
						if (property !== 'assertions') {
							// Error
							++errors;
							result = testcase.ele('error');
							
							if (errorItem.stacktrace) {
								result.dat(errorItem.stacktrace);
							}
						} else {
							// Failure
							++failures;
							result = testcase.ele('failure');
							result.dat(errorItem.stack);
						}
						
						result.att('type', errorItem.name);
						result.att('message', errorItem.message);
					}
				});
			});
		});
		
        newman.exports.push({
            name: 'junit-reporter-full',
            default: 'newman-run-report-full.xml',
            path: reporterOptions.export,
            content: global.end({
                pretty: true,
                indent: '  ',
                newline: '\n',
                allowEmpty: false
            })
        });
    });
};

module.exports = JunitFullReporter;