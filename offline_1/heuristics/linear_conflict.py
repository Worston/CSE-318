from .manhattan import manhattan_distance

# Manhattan + linear conflict heuristic
def linear_conflict_(board):
    manhattan = manhattan_distance(board)
    conflicts = 0
    k = board.grid_size
    # row-wise check
    for row in range(k):
        tiles = []
        for col in range(k):
            val = board.grid[row][col]
            if val!=0 and (val-1) // k == row:
                tiles.append(val)
        
        for i in range(len(tiles)):
            for j in range(i+1, len(tiles)):
                if tiles[i] > tiles[j]:
                    conflicts += 1        
    # Column-wise check
    for col in range(k):
        tiles = []
        for row in range(k):
            val = board.grid[row][col]
            if val!=0 and (val-1) % k == col:
                tiles.append(val)
        
        for i in range(len(tiles)):
            for j in range(i+1, len(tiles)):
                if tiles[i] > tiles[j]:
                    conflicts += 1
    # print(f"Linear Conflict: {manhattan+2*conflicts}")                
    return manhattan + 2*conflicts                        
                        