beanstalkd-js
=============

JavaScript code to get the current number of items remaining in your queue and how long before it's finished.

The following code will make the myQueue variable available to you for use likely binding it to the front
end of your application with angularjs or knockout.

### Example Use

```js
var test = new beanstalkd.beanstalkd("/api/orgsync/public/syncstatus", 3).kickoff();

var myQueue;

! function updater(){
	myQueue = test.getUpdates();
	setTimeout(updater, 3000);
}();
```

The following will return an array to the myQueue variable. From here you can access the following properties.

```js
/**
 * @param String qname - name of the queue
 * @param Boolean running - is the queue currently running
 * @param Integer jobs_complete - number of jobs that have completed
 * @param Integer jobs_total - number of jobs total
 * @param Boolean finished - is the queue done processing
 * @param Boolean syncInProgress - is the queue processing something
 * @param Integer minutesRemaining - time till queue is done
 * @param Integer percentComplete - percent finished
 **/
```

Accessing the name of queue would look like so...

```js
myQueue.qname;
```

## Returning The Proper JSON

You do have to return the following JSON however you choose. In PHP it would look like this. If you have gone about
implimenting this in another langauge please add it to this readme as well to make it easy for others.

### PHP

This requires the Pheanstalk composer package.

```php
public function syncStatus() {
    try 
    {
        $status = Queue::getPheanstalk()->statsTube(Config::get('queue.connections.beanstalkd.queue'));
        
        if ( $status->{'current-jobs-ready'} == $status->{'total-jobs'} ) 
        {
            return Response::json(array(
                'running' => FALSE
            ));
        }

        return Response::json(array(
            'running' => TRUE,
            'jobs_complete' => (($status->{'current-jobs-ready'} - $status->{'total-jobs'})*-1),
            'jobs_total' => ($status->{'total-jobs'}*1)
        ), 200);
    } 
    catch (Pheanstalk_Exception_ServerException $e) 
    {
        return Response::json(array(
            'running' => FALSE
        ));
    }
}
```
