from utils import inversion_count

# Functions to check if a board is solvable
def is_solvable(board):
    k = board.grid_size
    # print(k)
    inversions = inversion_count(board)
    # print(inversions)
    if k % 2 == 1:
        return inversions % 2 == 0
    else:
        blank_row = board.blank[0]
        blank_row_from_bottom = k - blank_row
        return (blank_row_from_bottom % 2 == 0 and inversions % 2 == 1) or (blank_row_from_bottom % 2 == 1 and inversions % 2 == 0) 
    
    