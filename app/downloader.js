const carpathia = (function(){

	'use strict';
	const electron = require('electron');
	const systemDialog = electron.remote.dialog;
	var systemFS = electron.remote.require('fs');

	const prevent = (e) => {e.preventDefault();};
	const wait = (time) => {
		return new Promise(resolve => {
			setTimeout(function(){
				resolve();
			}, time);
		})
	}
	const VINE_ROOT = `https://vine.co`;
	let VINE_VIDEOS = [];
	let VINE_DESTINATION = undefined;
	let COMPLETED_DOWNLOADS = 0;
	let ERRORED_DOWNLOADS = 0;

	const FORM_ANIMATION_TIME = 300;
	const DIALOG_ANIMATION_TIME = 700;
	const PROGRESS_ANIMATION_TIME = 500;

	function reset(){

		VINE_VIDEOS = [];
		VINE_DESTINATION = undefined;
		COMPLETED_DOWNLOADS = 0;
		ERRORED_DOWNLOADS = 0;

		userNameForm.reset();
		userNameForm.dataset.completed = "false";
		userNameForm.dataset.active = "true";

		fileDestinationForm.dataset.completed = "false";
		fileDestinationForm.dataset.active = "false";
		fileDestinationForm.dataset.visible = "false";

		wait(FORM_ANIMATION_TIME).then(function(){
			fileDestinationForm.dataset.visible = "true";
		});

		progressIndicator.set(0);
		progressIndicator.show();
	}

	const dialog = (function(){

		const minimumDisplay = 3000;
		let timeDisplayed = 0;

		const dialogElement = document.querySelector('#progressDialog');
		const titleElement = dialogElement.querySelector('#header');
		const messageElement = dialogElement.querySelector('#message');
		const spinnerElement = dialogElement.querySelector('#spinner');
		const buttonElement = dialogElement.querySelector('#actionButton');

		function showDialog(title, message, showSpinner = true, showButton = false, buttonWords = ""){
			
			titleElement.textContent = title;
			messageElement.textContent = message;
			dialogElement.dataset.active = "true";
			
			if(!showSpinner){
				spinnerElement.dataset.visible = "false";
			} else {
				spinnerElement.dataset.visible = "true";		
			}

			if(!showButton){
				buttonElement.dataset.visible = "false";
			} else {
				buttonElement.textContent = buttonWords;
				buttonElement.dataset.visible = "true";		
			}

			return wait(DIALOG_ANIMATION_TIME);
		}

		function hideDialog(){
			dialogElement.dataset.active = "false";
			return wait(DIALOG_ANIMATION_TIME);			
		}

		return {
			show : showDialog,
			hide : hideDialog,
			button : buttonElement
		};

	}());

	const hideDialogWithButton = function(){
		reset();
		dialog.button.removeEventListener('click', hideDialogWithButton, false);
		dialog.hide();
	};

	const progressIndicator = (function(){
		
		const progressElement = document.querySelector('#progress');
		const spans = progressElement.querySelectorAll('span');

		function setProgressIndicatorPosition(idx){
			
			spans.forEach( (span, spanIdx) => {
				if(spanIdx === idx){
					span.dataset.selected = "true";
				} else {
					span.dataset.selected = "false";
				}
			});

		}

		function showProgressIndicator(){
			progressElement.dataset.active = "true";
			return wait(PROGRESS_ANIMATION_TIME);
		}

		function hideProgressIndicator(){
			progressElement.dataset.active = "false";
			return wait(PROGRESS_ANIMATION_TIME);
		}

		return {
			set : setProgressIndicatorPosition,
			show : showProgressIndicator,
			hide : hideProgressIndicator
		};

	}());

	const downloadIndicator = (function(){

		const downloadElement = document.querySelector('#downloadDialog');
		const bar = downloadElement.querySelector('#downloadBar');
		const reportElement = downloadElement.querySelector('p');

		function showDownloadIndicator(){
			downloadElement.dataset.active = "true";
			return wait(DIALOG_ANIMATION_TIME);
		}

		function hideDownloadIndicator(){
			downloadElement.dataset.active = "false";
			return wait(DIALOG_ANIMATION_TIME);
		}

		function setDownloadIndicator(amount){

			const percentage = (amount / VINE_VIDEOS.length) * 100;
			bar.style.width = `${percentage}%`;
			
			reportElement.textContent = `${amount}/${VINE_VIDEOS.length} Vines downloaded`;

		}

		return {
			show : showDownloadIndicator,
			hide : hideDownloadIndicator,
			set : setDownloadIndicator
		};

	}());

	function retrieveVideos(){
		
		VINE_VIDEOS.forEach(vine => {

			fetch(vine.videoUrl)
				.then(res => res.blob())
				.then(blob => {

					var arrayBuffer;
					var fileReader = new FileReader();
					fileReader.onload = function() {
						arrayBuffer = this.result;
						
						var uint8Array  = new Uint8Array(arrayBuffer);
						systemFS.writeFile(`${VINE_DESTINATION}/${vine.created}.mp4`, uint8Array, function(err){
							if(err){
								ERRORED_DOWNLOADS += 1;
							} else {
								COMPLETED_DOWNLOADS += 1;
								
								downloadIndicator.set(COMPLETED_DOWNLOADS);

								if(COMPLETED_DOWNLOADS - ERRORED_DOWNLOADS === VINE_VIDEOS.length){
									downloadIndicator.hide()
										.then(function(){
											const buttonHandler = function(){
												
												reset();

												dialog.button.removeEventListener('click', buttonHandler, false);
												dialog.hide();
											};

											dialog.button.addEventListener('click', buttonHandler, false);
											dialog.show(
												'Vines downloaded!',
												`All of your Vines have been saved to ${VINE_DESTINATION}`,
												false,
												true,
												"ok"
											);
										})
									;
								}

							}
						});

					};
					fileReader.readAsArrayBuffer(blob);

				})
				.catch(err => {
					console.error(err);
				})
			;

		});

	}

	function getVideoDetails(profileID){

		const rootURL = `https://vine.co/api/timelines/users/${profileID}`;
		const requests = [];

		let totalCount = 0;
		let recordsSize = 0;
		let requiredRequests = 0

		return fetch(rootURL)
			.then(res => {
				if(res.status === 200){
					return res.json();
				} else {
					throw res;
				}
			})
			.then(d => {
			
				totalCount = d.data.count;
				recordsSize = d.data.records.length;
				requiredRequests = Math.ceil(totalCount / d.data.records.length);
				
				console.log(`totalCount: ${totalCount}, recordsSize: ${recordsSize}, requiredRequests: ${requiredRequests}`);

				for(var idx = 1; idx <= requiredRequests; idx += 1){
					requests.push(fetch(`${rootURL}?page=${idx}`).then(res => res.json()));
				}

				return Promise.all(requests)
					.then(responses => {

						const allVideos = [];
						
						responses.map(response => {
	
							response.data.records.forEach(record => {
								allVideos.push(record);
							});


						});
						
						return allVideos;

					})

				;

			})
			.catch(err => {
				console.error(err);
			})
		;

	}

	function getProfileID(request){
		return request.text()
			.then(body => {
				const idIndicatorString = `href="android-app://co.vine.android/vine/user-id/`;
				const idStartIdx = body.indexOf(`${idIndicatorString}`) + idIndicatorString.length;
				const idEndIdx = body.indexOf(`"`, idStartIdx);
				const profileID = body.slice(idStartIdx, idEndIdx);
				console.log(profileID);
				return profileID;
			})
		;
	}

	function figureOutProfileID(input){

		const profileRequests = [];

		if(input.indexOf(VINE_ROOT) > -1){
			return fetch(input);
		} else {
			return fetch(`${VINE_ROOT}/${input}`);
		}

	}

	const userNameForm = document.querySelector('#userNameForm');
	const fileDestinationForm = document.querySelector('#fileDestinationForm');

	userNameForm.addEventListener('submit', prevent, false);

	userNameForm.addEventListener('submit', function(e){

		figureOutProfileID(this.usernameInput.value)
			.then(res => {

				if(res.status !== 200){
					// Handle no profile
					const buttonHandler = function(){
						userNameForm.dataset.completed = "false";
						userNameForm.dataset.active = "true";
						dialog.button.removeEventListener('click', buttonHandler, false);
						dialog.hide();
					};

					dialog.button.addEventListener('click', buttonHandler, false);
					dialog.show(
						`Couldn't find profile`,
						'If you entered the username for your profile, try entering the URL for it instead',
						false,
						true,
						"ok"
					);	
					throw "Profile doesn't exist";
				} else {
					return getProfileID(res);
				}
			})
			.then(profileID => {
				dialog.show(
					`Checking...`,
					`Just looking up your account and getting the video URLs`
				);
				return getVideoDetails(profileID)
			})
			.then(videos => {
				dialog.hide();

				VINE_VIDEOS = videos;
				return wait(500);
			})
			.then(function(){
				userNameForm.dataset.active = "false";
				userNameForm.dataset.completed = "true";
				
				fileDestinationForm.querySelector('h3').textContent = `You have ${VINE_VIDEOS.length} videos to download`;
				fileDestinationForm.dataset.active = "true";
				
				progressIndicator.set(1);
			})
			.catch(err => {
				console.log(err);

				dialog.button.addEventListener('click', hideDialogWithButton, false);
				dialog.show(
					'An error occurred',
					'Sorry, something went wrong somewhere',
					false,
					true,
					"ok"
				);
			})
		;

	}, false);

	fileDestinationForm.addEventListener('submit', prevent, false);
	fileDestinationForm.querySelector('#destinationSelection').addEventListener('click', function(e){

		systemDialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']}, dest => {
			if(dest !== undefined){

				VINE_DESTINATION = dest;
				fileDestinationForm.dataset.completed = "true";
				wait(FORM_ANIMATION_TIME)
					.then(function(){
						progressIndicator.hide();
						downloadIndicator.set(0);
						downloadIndicator.show().then(retrieveVideos);
					})
				;
			}

		});

	}, false)
	
}());