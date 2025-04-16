class Board():
    def __init__(self, grid, parent=None):
        self.grid = grid
        self.parent = parent
        self.g_n = 0 if parent is None else parent.g_n +1
        self.h_n = 0
        self.grid_size = len(grid)
        self.blank = self._find_blank_()
        
    def _find_blank_(self):
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if self.grid[i][j] == 0:
                    return (i,j)
        return None         
    
    def __hash__(self):
        return hash(tuple(tuple(row) for row in self.grid))   
    
    def __eq__(self,other):
        return self.grid == other.grid
    
    def is_puzzle_solved(self):
        expected_val = 1
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if i == self.grid_size-1 and j == self.grid_size-1:
                    if self.grid[i][j] != 0:
                        return False
                else:
                    if self.grid[i][j] != expected_val:
                        return False    
                    expected_val += 1
        return True  
    
    def get_neighbor_nodes(self):
        i,j = self.blank
        neighbors = []
        moves = [(-1,0), (1,0), (0,-1), (0,1)]
        for dx, dy in moves:
            x, y = i+dx , j+dy
            if 0 <= x < self.grid_size and 0 <= y < self.grid_size:
                new_grid = [row.copy() for row in self.grid]
                new_grid[i][j], new_grid[x][y] = new_grid[x][y], new_grid[i][j]
                neighbors.append(Board(new_grid, self))       
        return neighbors                  
    
    # def __str__(self):
    #     return '\n'.join(" ".join(map(str, row)) for row in self.grid)