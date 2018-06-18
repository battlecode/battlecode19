import $ from 'jquery';

class Api {
    static getUpcomingDates(callback) {
        var new_state = [
            {id: 0, date: 'hi', data: 'message'},
            {id: 1, date: '24', data: 'message2'}
        ];

        callback(new_state);
    }

    static getUserMuHistory(callback) {
        var data = [10,12,14,10,28,32,25,32];

        callback(data);
    }

    static getUserWinStats(callback) {
        var data = [20,60,20];

        callback(data);
    }

    static getUpdates(callback) {
        var updates = [
            {id: 0, date: '10/2', time: '10:02', message: 'This is a critical update!'}
        ];

        callback(updates);
    }

    static search(query, callback) {
        var users = [{'id':0,'username':'nanogru','team':'teh devs','bio':'this is it buddy.'}];
        var teams = [];

        callback(users, teams);
    }

    static getUserTeam(callback) {
        var state = {
            team_name:'Teh Devs',
            team_id:2342,
            secret_key:'3f8wgugf',
            auto_accept:true,
            auto_run:false,
            division:'newbie',
            bio:'Isn\'t this a cool bio?',
            img:'',
            users:['jgru', 'oiheb', 'oedgg']
        };

        callback(state);
    }

    static updateTeam(params, callback) {
        callback(true);
    }

    static acceptScrimmage(scrimmage_id, callback) {
        callback();
    }

    static rejectScrimmage(scrimmage_id, callback) {
        callback();
    }

    static getScrimmageRequests(callback) {
        var requests = [
            {'id':104, 'team':'Teh Devs'}
        ];

        callback(requests);
    }

    static requestScrimmage(team_name, callback) {
        callback(true);
    }

    static getScrimmageHistory(callback) {
        var scrimmages = [
            {time:'10/20 2:24', status:'Won', team:'Teh Devs', color:'Red', replay:'434985u92.bc19z'}
        ];

        callback(scrimmages)
    }

    static getTournaments(callback) {
        var tournaments = [
            {'name':'sprint', 'challonge':'9023uhf'}
        ]

        callback(tournaments);
    }

    static getGitHead(callback) {
        var source = "// this is source code"

        callback(source);
    }

    static pushToGitHead(src, callback) {
        // do stuff with src

        callback(true); // no errors
    }
}

export default Api;