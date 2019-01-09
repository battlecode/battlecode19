from battlecode import BCAbstractRobot, SPECS
import battlecode as bc
import random

# Only enable these if you really need them.
#__pragma__('iconv')
#__pragma__('tconv')
#__pragma__('opov')

# don't try to use global variables!!
class MyRobot(BCAbstractRobot):
    step = -1

    def turn(self):
        k = self.get_visible_robots()[0]
        if self.is_visible(k):
            self.log("Can see k.")

        self.step += 1
        self.log("START TURN " + self.step)
        if self.me['unit'] == SPECS['CRUSADER']:
            self.log("Crusader health: " + str(self.me['health']))
            # The directions: North, NorthEast, East, SouthEast, South, SouthWest, West, NorthWest
            choices = [(0,-1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)]
            choice = random.choice(choices)
            self.log('TRYING TO MOVE IN DIRECTION ' + str(choice))
            return self.move(*choice)

        elif self.me['unit'] == SPECS['CASTLE']:
            if self.step < 10:
                self.log("Building a crusader at " + str(self.me['x']+1) + ", " + str(self.me['y']+1))
                return self.build_unit(SPECS['CRUSADER'], 1, 1)

            else:
                self.log("Castle health: " + self.me['health'])

robot = MyRobot()
