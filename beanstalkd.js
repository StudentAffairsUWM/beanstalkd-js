/**
 * Beanstalkd-js
 * -------------
 * This module is used for getting current data about
 * a beanstalkd queue your applications backend is utilizing.
 * It required that your backend return JSON in the form of...
 * 
 * []
 *
 * It will then return an object telling you how much is left and
 * how long it will take until the queue has completely finished.
 * 
 * Student Affairs IT - UW-Milwaukee
 **/

var beanstalkd = {

	beanstalkd: function(url, interval, debug) {

		/**
		 * @param url - URL we are getting JSON from
		 * @param interval - Time in seconds before next call
		 * @param debug - show debug infromation to see whats up
		 * @param queueObjects - last json object that was calculated
		 * @param initial - keep track if we need to create all objects
		 **/

		 this.url = url;

		 this.interval = interval * 1000;

		 this.debug = ((debug === undefined) ? false : debug);

		 this.queueObjects = [];

		// Calculate how much time is left
		// and return an object based on it.
		this.kickoff = function() {

			this.fetch_url(
				this.calculate
			);

			// Round and round we go...
			var _this = this;
			setTimeout(function(){
				_this.kickoff();
			}, this.interval);

		}

		// Return JSON data from the provided URL
		this.fetch_url = function(callback) {

			var request = new XMLHttpRequest();

			// Get access to this object
			var _this = this;

			request.onreadystatechange = function() {
				if (this.readyState === 4){
					if (this.status >= 200 && this.status < 400){
						//try {

							var json = JSON.parse(this.responseText);

							// Place object in array if we are only working with
							// one queue to reduce duplicate code.
							if(!(json instanceof Array)) {
								json = JSON.stringify(json);
								json = JSON.parse("[" + json + "]");
							}
							
							// On the first time through we will create the objects
							// and push them onto the newQueueObjects array. After this
							// we will only be accessing them with setters to handle some
							// special cases that may come up.
							for(i in json){

								if (_this.queueObjects.length < json.length){
									// Push new object onto the array
									_this.queueObjects.push(
										new beanstalkd.queueObject(
											json[i].queue,
											json[i].running,
											json[i].jobs_complete,
											json[i].jobs_total
											)
										);
								} else {
									// Change state of object based on lastest data
									_this.queueObjects[i].setQname(json[i].queue);
									_this.queueObjects[i].setRunning(json[i].running);
									_this.queueObjects[i].setTotal(json[i].jobs_total);
								}

								callback(_this.queueObjects[i], json[i].jobs_complete, _this);
							}

						// } catch (err) {
						// 	if(_this.debug) console.log(err);
						// }
					} else {
						if(_this.debug) console.log("Invalid URL or status code over 400.");
					}
				}
			};

			request.open('GET', this.url, true);
			request.send();

			request = null;

		}

		// Determine what object needs to be returned based on the
		// json that has been passed into the function.
		// requires json to feature the following instance variables
		// --------------------------------
		// @param String - queue          |
		// @param Boolean - running       |
		// @param Integer - jobs_complete |
		// @param Integer - jobs_total    |
		// --------------------------------
		this.calculate = function(obj, jobs, _this) {

			// In cases where running is false or undefined we can
			// only tell with certainty the process is not running.
			// We are not able to determine if the process has finished
			// or not.
			if(obj.running === false || obj.running === undefined) {

				obj.syncInProgress = false;

				if(obj.lastFinished !== 0) {
					// Lets clean up this object
					obj.syncFinished();
				}

			} else {

				obj.syncInProgress = true;

				if(obj.jobs_complete != jobs) {

					obj.setJobs(jobs);

					// Calculate minutes between calls
					var secondsRemaining = ((new Date().getTime() - obj.lastFinished) / 1000);
					var calculateWithJobsRemaining = (secondsRemaining * (obj.jobs_total - obj.jobs_complete))/60;

					if (calculateWithJobsRemaining < 1000) obj.setLastTenTimes(calculateWithJobsRemaining);

					// Calculate average with the last 10 calls
					var calcAverageRemaining = 0;
					var totalInAverage = 0;

					for(i in obj.lastTenTimes) {
						calcAverageRemaining += obj.lastTenTimes[i];
						totalInAverage++
					}

					// Save minutes remaining and how to display it nicely.
					obj.minutesRemaining = (calcAverageRemaining == 0) ? 9999 : Math.round(calcAverageRemaining/totalInAverage);
					obj.lastFinished = new Date().getTime();

				}

			}

			if(_this.debug) console.log(obj);
		}

	},

	// Object to hold all of the queue in!
	// it's so magical!!
	// @param qname - name of the queue
	// @param running - is the queue currently running
	// @param jobs - number of jobs that are finished
	// @param total - number of jobs in the queue
	queueObject: function(qname, running, jobs, total) {

		this.qname = qname;

		this.running = running;

		this.jobs_complete = ((jobs === undefined) ? 0 : jobs);

		this.jobs_total = ((total === undefined) ? 0 : total);

		// Interal properties to keep track of state changes

		this.finished = false;

		this.syncInProgress = false;

		this.lastFinished = 0;

		this.minutesRemaining = 0;

		this.lastTenTimes = [];

		this.percentComplete = 0;

		// Only should use the setters to access this data

		this.setQname = function(qname) {
			this.qname = qname;
		}

		this.setRunning = function(running) {
			this.running = running;
		}

		this.setJobs = function(jobs) {
			this.jobs_complete = jobs;
		}

		this.setTotal = function(total) {
			this.jobs_total = total;
		}

		this.syncFinished = function() {
			this.lastFinished = 0;
			this.finished = true;
			this.minutesRemaining = 0;
			this.lastTenTimes = [];
		}

		this.setLastTenTimes = function(data) {
			this.lastTenTimes.push(data);
			if(this.lastTenTimes.length > 10) this.lastTenTimes.shift();
		}

	}

};

var test = new beanstalkd.beanstalkd("/api/orgsync/public/syncstatus", 3, true);

test.kickoff();