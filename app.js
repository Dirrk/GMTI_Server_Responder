/**
 * Created by Derek Rada on 5/5/2014.
 */



/**
 * Module dependencies.
 */


var cluster = require('cluster'),
slave;


/**
 *  Master process
 */


if (cluster.isMaster)
{
    slave = cluster.fork();

    cluster.on('exit', function(deadSlave, code, signal) {
        console.log('Slave %d died with code/signal (%s). Restarting slave ', deadSlave.id, signal || code);
        slave = cluster.fork(); // create new slave
    });

}

/**
 *  Slave process
 *  
 */

else {

    strictWrapper();

    var path = require('path');
    var util = require('util');
    var osUtil = require('os-utils');
    var os = require('os');

    function strictWrapper() {
        "use strict";

        console.log('Slave initialized');

        // Express app
        var express = require('express');


        // Required
        var http = require('http');

        // Bind express and begin setting up the environment
        var app = express();

        // All environments
        app.set('port', process.env.PORT || 5000);
        app.use(express.json());


        // make currentData a global variable that gets updated periodically and when we call it way we do not need to wait on the server to process the command but can also refresh "instantly"
        var currentData = {

        };

        app.get('/', function (req, res) {
            res.json(currentData);
            run();
        });

        function run() {

            currentData = currentData;
            getData(function (dat) {
                if (dat) {
                    currentData = dat;
                }
            });
        };


        http.createServer(app).listen(
            app.get('port'), function () {
                console.log('Express server listening on port ' + app.get('port'));
                run();
                }
        );

        setInterval(run, 15000);

        function getData(cb) {

            var data = {
                cpu: 0.00,
                mem: (1 - osUtil.freememPercentage())*100
            };

            osUtil.cpuUsage(function (cpu) {
                data.cpu = (cpu * 100);
                cb(data);
            });
        }
    }


}