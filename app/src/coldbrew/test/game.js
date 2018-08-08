var expect = require('chai').expect;

var Game = require('../game');

describe('Game', function () {
    describe('#getRobot()', function() {
        it('should return a robot object if it exists', function() {
            var game = new Game(5,10);

            game.robots.forEach(function(robot) {
                var fetched = game.getRobot(robot.id);
                expect(fetched).to.be.equal(robot);
            });
        });

        it('should return null if the id is invalid', function() {
            var game = new Game(5,10);

            expect(game.getRobot("HI")).to.be.equal(null);
            expect(game.getRobot(null)).to.be.equal(null);
            expect(game.getRobot(1029392)).to.be.equal(null);
        });

    });

});
