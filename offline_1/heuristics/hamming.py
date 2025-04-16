# Hamming distance heuristic
def hamming_distance(board):
    count = 0
    for i in range(board.grid_size):
        for j in range(board.grid_size):
            val = board.grid[i][j]
            if val != 0 and val != i * board.grid_size + j + 1:
                count += 1
    return count            