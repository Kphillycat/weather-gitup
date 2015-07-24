/*
 * -------------------------------------------------------------------------
 *
 * Demo node application to wrap SOAP API in REST API wrapper 
 * utilizing Loopback framework
 * @author: Kphillycat
 * @reference: https://github.com/strongloop/loopback-connector-soap/
 * -------------------------------------------------------------------------
 */


var loopback = require('loopback');
// var path = require('path');
var loopbackConnectorSoap = require('loopback-connector-soap');

var app = module.exports = loopback();
// http://www.webservicex.com/stockquote.asmx?WSDL
var _WSDL = 'http://wsf.cdyne.com/WeatherWS/Weather.asmx?WSDL';

// All the endpoints will be in the format http://localhost:3000/api/WeatherServices/[ENDPOINT]
app.set('restApiRoot', '/api');

// To invoke a SOAP web service, we first configure a data source backed by the SOAP connector.
var ds = loopback.createDataSource('soap',
  {
    connector: loopbackConnectorSoap,
    // remoteEnabled indicates if the operations will be further exposed as REST APIs
    remotingEnabled: false,
    wsdl: _WSDL // The url to WSDL
  });
// We can also pass many more options to the data source configuration above
// wsdl_options: Indicates additonal options to pass to the soap connector. for example allowing self signed certificates
// operations: Maps WSDL operations to Node methods
// security: The valid schemes are 'WS' (or 'WSSecurity'), 'BasicAuth', and 'ClientSSL'.
// soapHeaders: custom headers

// Unfortunately, the methods from the connector are mixed in asynchronously
// This is a hack to wait for the methods to be injected
ds.once('connected', function () {

  // Create the model
  var WeatherService = ds.createModel('WeatherService', {});

  // Once the model is defined we will need to create new methods that redefine or abstract other SOAP procedures
  // Here we're creating a new forecast method endpoint that will call the GetCityForecastByZip operation 
  // that takes a zip parameter or 11201 by default and returns an array
  WeatherService.forecast = function (zip, cb) {
    WeatherService.GetCityForecastByZIP({ZIP: zip || '11201'}, function (err, response) {
      // console.log('Forecast: %j', response);
      var result = (!err && response.GetCityForecastByZIPResult.Success) ?
        response.GetCityForecastByZIPResult.ForecastResult.Forecast : [];
      cb(err, result);
    });
  };

  WeatherService.weather = function (zip, cb) {
    WeatherService.GetCityWeatherByZIP({ZIP: zip || '11201'}, function (err, response) {
      // console.log('Weather: %j', response);
      var result = (!err && response.GetCityWeatherByZIPResult.Success) ? response : {};
      // var result = response;
      cb(err, result);
    });
  };

  // Expose the custom methods on the model to the REST API via loopback.remoteMethod
  loopback.remoteMethod(
    WeatherService.forecast, {
      accepts: [
        {arg: 'zip', type: 'string', required: true,
          http: {source: 'query'}}
      ],
      returns: {arg: 'result', type: 'object', root: true},
      http: {verb: 'get', path: '/forecast'}
    }
  );

  loopback.remoteMethod(
    WeatherService.weather, {
      accepts: [
        {arg: 'zip', type: 'string', required: true,
          http: {source: 'query'}}
      ],
      returns: {arg: 'result', type: 'object', root: true},
      http: {verb: 'get', path: '/weather'}
    }
  );

  // Expose to REST
  app.model(WeatherService);

  // LoopBack REST interface
  app.use(app.get('restApiRoot'), loopback.rest());

  // Jump right to explorer
  app.get('/', function(req, res){
    res.redirect('/explorer');
  });

  // API explorer (if present)
  try {
    var explorer = require('loopback-explorer')(app);
    app.use('/explorer', explorer);
    app.once('started', function (baseUrl) {
      console.log('Browse your REST API at %s%s', baseUrl, explorer.route);
    });
  } catch (e) {
    console.log(
      'Run `npm install loopback-explorer` to enable the LoopBack explorer'
    );
  }

  app.use(loopback.urlNotFound());
  app.use(loopback.errorHandler());

  if (require.main === module) {
    app.start();
  }

});

// Start the server
app.start = function () {
  return app.listen(3000, function () {
    var baseUrl = 'http://127.0.0.1:3000';
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
  });
};