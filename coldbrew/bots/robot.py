from battlecode import BCAbstractRobot, SPECS

__pragma__('iconv')
__pragma__('tconv')
#__pragma__('opov')

class MyRobot(BCAbstractRobot):
    def __init__(self):
        self.step = -1
        super().__init__()

    def turn(self):
        self.step += 1

        if self.me['unit'] == SPECS['CRUSADER'] and self.me['team'] == SPECS['RED']:
            self.log("Crusader health: " + str(self.me['health']))
            return self.attack(-1,-1)

        elif self.me['unit'] == SPECS['CASTLE']:
            if self.step == 0:
                self.log("Building a crusader at " + str(self.me['x']+1) + ", " + str(self.me['y']+1))
                return self.build_unit(SPECS['CRUSADER'], 1, 1)

            else:
                self.log("Castle health: " + str(self.me['health']))

robot = MyRobot()