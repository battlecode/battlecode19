class BCAbstractRobot:
    def __init__(self):
        self._bc_reset_state()

    def _do_turn(self, game_state):
        self._bc_game_state = game_state
        self.id = game_state['id']
        self.karbonite = game_state['karbonite']
        self.fuel = game_state['fuel']
        self.last_offer = game_state['last_offer']

        self.me = self.get_robot(self.id)

        try:
            t = self.turn()
        except Exception as e:
            t = self._bc_error_action(e)

        if not t:
            t = self._bc_null_action()

        self._bc_reset_state()

        return t

    def _bc_reset_state(self):
        # Internal robot state representation
        self._bc_logs = [];
        self._bc_signal = 0;
        self._bc_signal_radius = 0;
        self._bc_game_state = None;
        self._bc_castle_talk = 0;
        
        self.me = None;
        self.id = None;
        self.fuel = None;
        self.karbonite = None;
        self.last_offer = None;

    def _bc_null_action(self):
        return {
            'signal': self._bc_signal,
            'signal_radius': self._bc_signal_radius,
            'logs': self._bc_logs,
            'castle_talk': self._bc_castle_talk
        }

    def _bc_error_action(self, e):
        a = self._bc_null_action()
        a['error'] = str(e)

        return a

    def _bc_check_on_map(self, x, y):
        return x >= 0 and x < len(self._bc_game_state['shadow'][0]) and y >= 0 and y < len(self._bc_game_state['shadow'])
    
    def log(self, message):
        self._bc_logs.append(str(message))

    def get_robot(self, id):
        if id <= 0:
            return None

        for robot in self._bc_game_state['visible']:
            if robot.id == id:
                return robot
            
        return None;

    def turn(self):
        return None

class MyRobot(BCAbstractRobot):
    def turn(self):
        self.log("Hello world!")
        self.log({'hi':0})
        self.log(self.me)

        raise Exception("oopsie!")

        return None