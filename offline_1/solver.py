import heapq

# A* search algorithm implementation
def a_star_search(initial_state, heuristic_func):
    open_list = []
    counter = 0
    initial_state.h_n = heuristic_func(initial_state)
    heapq.heappush(open_list, (initial_state.h_n, initial_state.h_n, counter, initial_state))
    closed_list = set()
    explored, expanded = 0,0
    
    while open_list:
        _, _, _, current_node = heapq.heappop(open_list)
        
        if current_node.is_puzzle_solved():
            path = []
            while current_node:
                path.append(current_node)
                current_node = current_node.parent
            return path[::-1], len(path)-1, explored, expanded    
        
        # if hash(current_node) in closed_list:
        #     continue
        closed_list.add(hash(current_node))
        expanded += 1
        
        neighbors = current_node.get_neighbor_nodes()
        # expanded += len(neighbors)
        
        for neighbor in neighbors:
            if hash(neighbor) in closed_list:
                continue
            neighbor.g_n = current_node.g_n + 1
            neighbor.h_n = heuristic_func(neighbor)
            f_n = neighbor.g_n + neighbor.h_n
            # print(f_n)
            counter += 1
            heapq.heappush(open_list,(f_n, neighbor.h_n,counter, neighbor))
            explored += 1
    return None, 0, 0, 0    