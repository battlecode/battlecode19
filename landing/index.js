var editor = ace.edit("code-editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");

var pyCode = `# use all language features,
# including packages!
from random import random

# called each turn in the game
def turn():
    # pick a random direction to move
    dir = int(random()*4)

    # make sure that direction is on map
    while bc.inDirection(dir) is None:
        dir = int(random()*4)

    # attack if square is occupied
    if bc.inDirection(dir) > 0:
        return bc.attack(dir)
    # otherwise move
    else:
        return bc.move(dir)
`;

var jsCode = `// called each turn in the game
function turn() {
    // pick a random direction not off map
    var dir = 0;
    do {
        dir = Math.floor(Math.random()*4);
    } while (bc.inDirection(dir) === null);

    // if the space is free, move to it.
    if (bc.inDirection(dir) === 0)
        return bc.move(dir);

    // otherwise, get the robot in that space
    var robot = bc.getRobot(bc.inDirection(dir));

    // if the robot is not friendly, attack
    if (robot.team != bc.me().team)
        return bc.attack(dir);
}
`;

var javaCode = `// use normal language features such as imports
import java.util.Random;
import org.battlecode.bc;

// class contains all robot code
public class Robot extends BattleRobot {
    // called each turn in the game.
    public Move getTurn() {
        Random rand;

        // pick a random direction not off map
        int dir = 0;
        do dir = rand.nextInt(4);
        while (bc.inDirection(dir) == bc.OFF_MAP);

        // if the space is free, move to it.
        if (bc.inDirection(dir) == bc.FREE)
            return bc.move(dir);

        // otherwise, get the robot in that space
        BattleRobot robot = bc.getRobot(bc.inDirection(dir));

        // if the robot is not friendly, attack
        if (robot.getTeam() != getTeam())
            return bc.attack(dir);

    }
}
`;


var lang = "python";
var langSelect = Array.from(document.getElementById("lang-select").children);
langSelect.forEach(function(child) {
    child.addEventListener("click", function() {
        langSelect.forEach(function(subChild) {
            subChild.style.backgroundColor = "#fefefe";
        });

        child.style.backgroundColor = "rgb(247,203,190)";

        if (child.innerText === "Python") {
            editor.session.setMode("ace/mode/python");
            editor.setValue(pyCode, -1);
            lang = "python";
        } else if (child.innerText === "Javascript") {
            lang = "javascript";
            editor.session.setMode("ace/mode/javascript");
            editor.setValue(jsCode, -1);
        } else if (child.innerText === "Java") {
            lang = "java";
            editor.session.setMode("ace/mode/java");
            editor.setValue(javaCode, -1);
        }

    });
}); langSelect[0].click();
