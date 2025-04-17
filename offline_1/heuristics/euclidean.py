from math import sqrt

# Euclidean distance heuristic
def euclidean_distance(board):
    total = 0.0
    for i in range(board.grid_size):
        for j in range(board.grid_size):
            val = board.grid[i][j]
            if val == 0:
                continue
            expected_row = (val-1) // board.grid_size
            expected_col = (val-1) % board.grid_size
            dx, dy = i-expected_row, j-expected_col
            total += sqrt(dx**2 + dy**2)
    return total 