;(function(){
    angular.module('weatherApp').controller('weatherCtrl', weatherCtrl);

    weatherCtrl.$inject = ['weatherGetter'];

    function weatherCtrl(weatherGetter) {
    	var vm = this;
    	vm.zip = '';
    	vm.weather = {};
    	vm.getWeather = function(zip) { 
    		vm.weather.http = weatherGetter.grab(zip || '11201');

    		vm.weather.http.then(function(resp) {
    			vm.weather.resp = resp.data.GetCityWeatherByZIPResult;
    			console.log(resp.data.GetCityWeatherByZIPResult);
    		}).catch(function(err) { 
    			console.log(err);
    		});
    	};
    }
})();