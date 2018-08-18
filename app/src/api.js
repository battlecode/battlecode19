import $ from 'jquery';
import * as Cookies from "js-cookie";

var URL = "http://127.0.0.1:8000";
var LEAGUE = 0

class Api {
    static getUpcomingDates(callback) {
        var new_state = [
            {id: 0, date: 'hi', data: 'message'},
            {id: 1, date: '24', data: 'message2'}
        ];

        callback(new_state);
    }

    static getTeamMuHistory(callback) {
        var data = [10,12,14,10,28,32,25,32];

        callback(data);
    }

    static getTeamWinStats(callback) {
        var data = [20,60,20];

        callback(data);
    }

    static getUpdates(callback) {
        $.get(URL+"/api/league/"+LEAGUE+"/", function(data, success) {
            for (var i=0; i<data.updates.length; i++) {
                var d = new Date(data.updates[i].time);
                data.updates[i].date = d.toLocaleDateString();
                data.updates[i].time = d.toLocaleTimeString();
            }

            callback(data.updates);
        });
    }

    static search(query, callback) {
        $.get(URL+"/api/"+LEAGUE+"/team/?search="+encodeURIComponent(query), function(team_data, team_success) {
            $.get(URL+"user/profile/?search="+encodeURIComponent(query), function(user_data, user_success) {
                callback(user_data.results, team_data.results);
            });
        });
    }

    static getUserTeam(callback) {
        $.get(URL+"/api/"+LEAGUE+"/team/?username="+encodeURIComponent(Cookies.get('username'))).done(function(data, status){
            if (data.results.length === 0) callback(null);
            else {
                Cookies.set('team_id',data.results[0].id);
                $.get(URL+"/api/"+LEAGUE+"/team/"+data.results[0].id+"/").done(function(data, status) {
                    callback(data);
                });
            }
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static updateTeam(params, callback) {
        $.ajax({
            url:URL+"/api/"+LEAGUE+"/team/"+Cookies.get('team_id')+"/",
            data:JSON.stringify(params),
            type:'PATCH',
            contentType:'application/json',
            dataType: 'json'
        }).done(function(data, status) {
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static acceptScrimmage(scrimmage_id, callback) {
        $.ajax({
            url:URL+"/api/"+LEAGUE+"/scrimmage/"+scrimmage_id+"/accept/",
            method:"PATCH"
        }).done(function(data, status) {
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static rejectScrimmage(scrimmage_id, callback) {
        $.ajax({
            url:URL+"/api/"+LEAGUE+"/scrimmage/"+scrimmage_id+"/reject/",
            method:"PATCH"
        }).done(function(data, status) {
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static getScrimmageRequests(callback) {
        this.getAllTeamScrimmages(function(scrimmages) {
            var requests = []
            for (let i=0; i<scrimmages.length; i++) {
                if (scrimmages[i].status !== "pending") continue;
                if (scrimmages[i].requested_by !== parseInt(Cookies.get('team_id'))
                    || scrimmages[i].blue_team.id === scrimmages[i].red_team.id) {
                    requests.push({
                        id:scrimmages[i].id,
                        team_id:scrimmages[i].requested_by,
                        team:(scrimmages[i].requested_by===scrimmages[i].red_team.id)?scrimmages[i].red_team.name:scrimmages[i].blue_team.name
                    });
                }
            }
            callback(requests);
        });
    }

    static requestScrimmage(team_name, callback) {
        $.get(URL+"/api/"+LEAGUE+"/team/?search="+encodeURIComponent(team_name), function(team_data, team_success) {
            if (team_data.results.length === 0) return callback(false);
            $.post(URL+"/api/"+LEAGUE+"/scrimmage/", {
                red_team:Cookies.get('team_id'),
                blue_team:team_data.results[0].id,
                ranked:false
            }).done(function(data, status) {
                callback(true)
            });
        });
    }

    static getAllTeamScrimmages(callback) {
        $.get(URL+"/api/"+LEAGUE+"/scrimmage/", function(data, succcess) {
            callback(data.results);
        });
    }

    static getScrimmageHistory(callback) {
        let my_id = parseInt(Cookies.get('team_id'));
        this.getAllTeamScrimmages(function(s) {
            var requests = []
            for (let i=0; i<s.length; i++) {
                let on_red = s[i].red_team.id === my_id;
                if (s[i].status === "pending" && s[i].requested_by !== my_id) continue;

                if (s[i].status === "redwon") s[i].status = on_red ? "won":"lost";
                else if (s[i].status === "bluewon") s[i].status = on_red ? "lost":"won";
                s[i].status = s[i].status.charAt(0).toUpperCase() + s[i].status.slice(1);

                s[i].date = new Date(s[i].updated_at).toLocaleDateString();
                s[i].time = new Date(s[i].updated_at).toLocaleTimeString();

                s[i].team = on_red ? s[i].blue_team.name : s[i].red_team.name;
                s[i].color = on_red ? 'Red' : 'Blue';

                requests.push(s[i]);
            } callback(requests);
        });
    }

    static getTournaments(callback) {
        var tournaments = [
            {'name':'sprint', 'challonge':'9023uhf'}
        ]

        callback(tournaments);
    }

    static createTeam(team_name, callback) {
        $.post(URL+"/api/"+LEAGUE+"/team/",{'name':team_name }).done(function(data, status){
            Cookies.set('team_id',data.id);
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static joinTeam(secret_key, team_id, callback) {
        $.ajax({
            'url':URL+"/api/"+LEAGUE+"/team/"+team_id+"/join/",
            'type':'PATCH',
            'data':{'team_key':secret_key }
        }).done(function(data, status){
            Cookies.set('team_id',data.id);
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static getUserProfile(callback) {
        $.get(URL+"/api/user/profile/"+encodeURIComponent(Cookies.get('username'))+"/").done(function(data, status) {
            $.get(data.url).done(function(data, success) {
                callback(data);
            }).fail(function(xhr, status, error) {
                console.log(error);
            });
        });
    }

    static updateUser(profile, callback) {
        // do stuff with profile

        callback(true);
    }

    static loginCheck(callback) {
        $.ajaxSetup({
            headers: { 'Authorization': 'Bearer ' + Cookies.get('token') }
        });

        $.post(URL+"/auth/token/verify/", {
            token: Cookies.get('token')
        }).done(function(data, status){
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static logout(callback) {
        Cookies.set('token',"");
        Cookies.set('refresh',"");
        callback();
    }

    static login(username, password, callback) {
        $.post(URL+"/auth/token/", {
            username: username,
            password:password
        }).done(function(data, status){
            Cookies.set('token',data.access);
            Cookies.set('refresh',data.refresh);
            Cookies.set('username',username);
            
            callback(true);
        }).fail(function(xhr, status, error) {
            callback(false);
        });
    }

    static register(email, username, password, first, last, dob, callback) {
        $.post(URL+"/api/user/", {
            email: email,
            username:username,
            password:password,
            first_name:first,
            last_name:last,
            date_of_birth:dob
        }).done(function(data, status){
            this.login(email, password, callback);
        }.bind(this)).fail(function(xhr, status, error) {
            console.log("WHAT")
        });
    }

    static forgotPassword(email, callback) {
        callback(true);
    }

    static pushTeamCode(code, callback) {
        this.updateTeam({'code':code}, callback);
    }
}

export default Api;