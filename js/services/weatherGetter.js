;(function(){
	angular.module('weatherApp').factory('weatherGetter', weatherGetterFactory);

	weatherGetterFactory.$inject = ['$http'];

	function weatherGetterFactory($http){
		return {
			grab: function(zip) {
				return  $http.get('http://localhost:3000/api/WeatherServices/weather?zip=' + zip);
			}
		}

	}
})();