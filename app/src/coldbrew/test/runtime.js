var expect = require('chai').expect;

var Coldbrew = require('../runtime');
var Game = require('../game');

var js_buggy_init = `
functio turn() {
    return null;
}
`;

var py_buggy_init = `
de turn():
    return None
`;

var js_success_init = `
function turn() {
    return null;
}
`;

var py_success_init = `
def turn():
    return None
`

var js_competent = `
function turn() {
    do var dir = Math.floor(Math.random()*4);
    while (bc.inDirection(dir) == null);

    if (bc.inDirection(dir) == 0) return bc.move(dir);
    else {
        var robot = bc.getRobot(bc.inDirection(dir));
        if (robot.team == bc.me().team) return;
        else return bc.attack(dir);
    }
}
`;

var coldbrew = new Coldbrew();

describe('Coldbrew', function () {
    describe('#playGame()', function() {
        it('should crown a team victor if the other fails to initialize', function(done) {
            this.timeout(15000);

            coldbrew.onInit(function() {
                var game = new Game(5,10,false);

                var red = {'code':js_buggy_init,'lang':'javascript'};
                var blue = {'code':js_success_init,'lang':'javascript'};

                var started_game = false;
                coldbrew.playGame(red,blue,game,function() {
                    started_game = true;
                }, function() {
                    expect(started_game).to.be.equal(false);
                    expect(game.winner).to.be.equal(1);
                    expect(game.win_condition).to.be.equal(3);

                    game = new Game(5,10,false);

                    blue = {'code':py_buggy_init,'lang':'python'};
                    coldbrew.playGame(red,blue,game,null,function() {
                        expect(game.win_condition).to.be.equal(4);
                        done();
                    });
                });
            });
        });

        it('should make a better bot beat a worse bot', function(done) {
            this.timeout(15000);

            coldbrew.onInit(function() {
                var red = {'code':js_success_init,'lang':'javascript'};
                var blue = {'code':js_competent,'lang':'javascript'};

                var game = new Game(5,10,false,100);

                var started_game = false;
                coldbrew.playGame(red,blue,game,function() {
                    started_game = true;
                }, function() {
                    expect(started_game).to.be.equal(true);
                    expect(game.winner).to.be.equal(1);

                    game = new Game(5,10,false,100);
                    started_game = false;
                    coldbrew.playGame(blue,red,game,function() {
                        started_game = true;
                    }, function() {
                        expect(started_game).to.be.equal(true);
                        expect(game.winner).to.be.equal(0);
                        done();
                    });
                });
            });
        });

    });
});
