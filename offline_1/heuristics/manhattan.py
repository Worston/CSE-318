# Manhattan distance heuristic
def manhattan_distance(board):
    sum = 0
    for i in range(board.grid_size):
        for j in range(board.grid_size):
            val = board.grid[i][j]
            if val == 0:
                continue
            expected_row = val-1 // board.grid_size
            expected_col = val-1 % board.grid_size
            sum += abs(i - expected_row) + abs(j - expected_col)
    return sum        