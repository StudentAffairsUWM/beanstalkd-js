beanstalkd-js
=============

JavaScript code to get the current number of items remaining in your queue and how long before it's finished.

The following code will make the myQueue variable available to you for use likely binding it to the front
end of your application with angularjs or knockout.

```js
var test = new beanstalkd.beanstalkd("/api/orgsync/public/syncstatus", 3).kickoff();

var myQueue;

! function updater(){
	myQueue = test.getUpdates();
	setTimeout(updater, 3000);
}();
```