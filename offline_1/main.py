from heuristics import manhattan_distance, hamming_distance, euclidean_distance, linear_conflict_
from board import Board
from solver import a_star_search
from utils import print_board
from solvability import is_solvable

def main():
    k = int(input())
    grid = [list(map(int, input().split())) for _ in range(k)]
    initial_node = Board(grid)
    
    # Solvability check
    if not is_solvable(initial_node):
        print("Unsolvable puzzle")
        return
    
    heuristic = hamming_distance
    
    path, cost, explored, expanded = a_star_search(initial_state=initial_node, 
                                                   heuristic_func=heuristic)
    
    print(f"Minimum number of moves: {cost}")
    
    for config in path:
        print_board(config)
        
    print(f"Nodes explored: {explored}")
    print(f"Nodes expanded: {expanded}")    
    
if __name__ == "__main__":
    main()