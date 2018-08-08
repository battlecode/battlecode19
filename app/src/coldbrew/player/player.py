from random import random

class BCAbstractRobot:
	def __init__(self):
		self.game_state = None

	def _do_turn(self, game_state):
		self.game_state = game_state
        return self.turn()

    def move(self):
    	return None

    def turn(self):
    	return None

################################

class MyRobot(BCAbstractRobot):
	def turn(self):
		dir = int(random()*4)
		self.move(dir)

###############################

robot = MyRobot()

"""
def turn():
    dir = int(random()*4)
    while bc.inDirection(dir) is None:
        dir = int(random()*4)

    if random() > 0.9:
        bc.log("I exist!")

    if bc.inDirection(dir) > 0:
        return bc.attack(dir)
    else:
        return bc.move(dir)
"""

