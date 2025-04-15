# Node structure used in A* (state, g, h, f, parent, etc.)
class State:
    def __init__(self, board, g, h, parent=None):
        self.board = board
        self.g = g
        self.h = h
        self.f = g + h
        self.parent = parent