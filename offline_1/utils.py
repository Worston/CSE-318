def flatten_board(board):
    return [val for row in board.grid for val in row if val != 0]

def inversion_count(board):
    count = 0
    
    flattened_list = flatten_board(board)
    # print(flattened_list)
    for i in range(len(flattened_list)):
        for j in range(i+1, len(flattened_list)):
            if flattened_list[i] > flattened_list[j]:
                count += 1
    return count            

def print_board(board):
    for row in board.grid:
        print(" ".join(str(tile).rjust(2) for tile in row))
    print()    