beanstalkd-js
=============

JavaScript code to get the current number of items remaining in your queue and how long before it's finished.

```
var test = new beanstalkd.beanstalkd("/path/to/url", 3);

test.kickoff();
```