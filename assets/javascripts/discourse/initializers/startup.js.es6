export default {

	name: 'startup',
	
	initialize() {
		document.body.style.display = 'none'
		var tmc, $cookNum, $toUse, $timeNum, $firstTime, $secondTime, $reCAPTCHA, currentURL

		tmc = null;
		currentURL = ''
		$firstTime = ''
		$secondTime = ''
		$reCAPTCHA = ''

		//firebase settings
		var isAnonymous, uid;

		//Get user IP first

		function treatCode()
		{
			fetch('http://api.ipify.org/?format=json')
			.then((json) =>
			{
				console.log(json);
				json.json().then((response2) =>
				{
					var userIP = response2.ip;
					console.log(userIP);
					console.log('Got IP:' + userIP);
					
					findByKey(userIP.replace(/\./g, "-"), function(result)
					{
						console.log('Finding User at firebase, result:' + result.visit);

						if(!result || result.error){
							$cookNum = 1
							$toUse = 1
							$timeNum = $firstTime
						} else {
							$cookNum = parseInt(result.visit)+1
							$toUse = parseInt(result.toUse)
							$timeNum = parseInt(result.timeNum)
						}
						//Update cookie numers
						document.body.style.display = 'block'

						console.log('Cookie after checking with firebase, cookNum, timeNum, toUse: ', $cookNum, $timeNum, $toUse);

						updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
							console.log(result);
						});
						console.log('Update by key emitted.');

						if($cookNum >= $timeNum && $reCAPTCHA.length > 0)
						{
							// Trigger reCAPTCHAv2
							document.body.innerHTML = '\
							<div style="margin-left: 40%; margin-top: 13%;">\
								<div style="width: 218px; height: 80px; background-color: skyblue;">\
									<img src="" alt="Logo goes here 218x80">\
								</div>\
								<div class="g-recaptcha" data-sitekey="'+$reCAPTCHA+'"></div>\
								<div><a href="https://www.google.com/recaptcha/intro/android.html">Click here</a> To learn why you get this all the time.</div>\
							</div>\
							\
							';
							var reCAPT = document.createElement('script');
							reCAPT.src = 'https://www.google.com/recaptcha/api.js'
							reCAPT.type = 'text/javaScript'
							reCAPT.async = true
							reCAPT.defer = true
							document.body.appendChild(reCAPT)
							console.log('Waiting response from recaptcha');
							tmc = setInterval(function () {
								if (typeof grecaptcha !== 'undefined') {
									if (grecaptcha.getResponse().length > 0) {
										console.log('Response of reCAPTCHA: ' + grecaptcha.getResponse());
										//Verification is successful
										$toUse = 1 - $toUse;
										$cookNum = 0;
										$timeNum = $timeNum == $firstTime ? $secondTime : $firstTime;
										//Update firebase
										updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
											console.log(result);
											// location.reload();
											window.location.href = window.location.href;
										});
									}
								}
							}, 1000);
						} else {
							if (tmc != null){
								clearInterval(tmc);
								tmc = null;
							}
						}
					})
				})
			});
		}

		window.onload = function()
		{
			$firstTime = this.Discourse.SiteSettings.discourse_captcha_first_max_visit_time
			$secondTime = this.Discourse.SiteSettings.discourse_captcha_second_max_visit_time
			$reCAPTCHA = this.Discourse.SiteSettings.discourse_captcha_site_key
			console.log('first limit of visits: ' + $firstTime);


			var script = document.createElement("script")
			script.type = "text/javascript";
			script.src = 'https://www.gstatic.com/firebasejs/4.12.0/firebase.js';
			document.getElementsByTagName("head")[0].appendChild(script);
			var config = {
				apiKey: "AIzaSyAZ78t94ci-yfkDy59VRhe0fVUo0gv-5sE",
				authDomain: "ip-track-a91bc.firebaseapp.com",
				databaseURL: "https://ip-track-a91bc.firebaseio.com",
				projectId: "ip-track-a91bc",
				storageBucket: "ip-track-a91bc.appspot.com",
				messagingSenderId: "929383303576"
			};
			firebase.initializeApp(config);
			firebase.auth().signInAnonymously().catch(function (error) {
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log('error occured: error : ', error.code);
			});
			firebase.auth().onAuthStateChanged(function (user) {
				if (user) {
					var isAnonymous = user.isAnonymous;
					var uid = user.uid;
					console.log(isAnonymous + uid);
				}
			});


			loadUp();
		}

		window.addEventListener('load', loadUp, false);

		function loadUp()
		{
			setInterval(function(){
				if(document.URL != currentURL)
				{
					treatCode();
					currentURL = document.URL;
				}
			}, 500);
		}

		var findByKey = (key, callback) => {fetch('https://ip-track-a91bc.firebaseio.com/users/'+key+'.json')
			.then(function(response){
				response.json().then(function(response2){
					callback(response2)
				});
			});
		}

		var updateByKey = (key, values, callback) =>
		{
			fetch('https://ip-track-a91bc.firebaseio.com/users/'+key+'.json', 
			{
				'headers'	: {'content-type': 'application/json'},
				'method' 	: 'PUT',
				'body' 		: JSON.stringify(values)
			}).then(function(response){
				response.json().then(function(response2){
					callback(response2)
				});
			});
		}
	}
}