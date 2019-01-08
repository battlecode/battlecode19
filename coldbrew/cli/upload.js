#!/usr/bin/env node

const fs = require("fs");
const axios = require("axios");
const path = require('path');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

updateNotifier({
    pkg,
    updateCheckInterval:1000*20 // 20 seconds
}).notify();

var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -i compiled_bot.js', 'Upload compiled_bot.js.')
    .alias('i', 'input_bot')
    .describe('i', 'The compiled js file of the bot to be uploaded.')
    .demandOption(['i'])
    .help('h')
    .alias('h', 'help')
    .argv;

if (!process.env.BC_USERNAME || !process.env.BC_PASSWORD) {
	console.log("Must set BC_USERNAME and BC_PASSWORD environment variables.");
	process.exit();
}

var code;
try {
    code = fs.readFileSync(argv.i, 'utf8');
} catch (err) {
    console.log("Error loading compiled JS.");
    console.log(err);
    process.exit();
}

// Generate token
const URL = "http://battlecode.org";

function uploadCode(token) {
	axios.get(URL+"/api/userteam/"+encodeURIComponent(process.env.BC_USERNAME)+"/0/", {
		headers: {"Authorization" : `Bearer ${token}`}
	}).then(function(response) {		
		axios.patch(URL+"/api/0/team/"+response.data['id']+"/", {
			code: code,
		}, { headers: {"Authorization" : `Bearer ${token}`}}).then(function(response) {
			console.log("Sucessfully uploaded code.");
		}).catch(function(e) {
			console.log("Failed to upload code.");
			console.log(e);
		});
	}).catch(function(e) {
		console.log("Failed to get user team.  Could you not be on a team?");
	});

}

axios.post(URL+"/auth/token/", {
	username: process.env.BC_USERNAME,
	password: process.env.BC_PASSWORD
}).then(function(response) {
	var token = response.data['access'];
	uploadCode(token);
}).catch(function(e) {
	console.log(e);
	console.log("Failed to generate token.  Incorrect user/pass, or no internet.");
});