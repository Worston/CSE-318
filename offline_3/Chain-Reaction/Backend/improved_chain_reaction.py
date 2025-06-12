from typing import List, Tuple, Dict, Optional
from enum import Enum
import time
import math
import random

class Player(Enum):
    EMPTY = "Empty"
    RED = "Red"
    BLUE = "Blue"

class GameMode(Enum):
    USER_VS_USER = 1
    USER_VS_AI = 2
    AI_VS_AI = 3

class AIType(Enum):
    SMART = "Smart AI (Minimax)"
    RANDOM = "Random AI"

class Cell:
    def __init__(self):
        self.orbs = 0
        self.player = Player.EMPTY
    
    def __str__(self):
        if self.player == Player.EMPTY:
            return "⚫"
        elif self.player == Player.RED:
            return f"🔴{self.orbs}" if self.orbs > 0 else "⚫"
        else:  # BLUE
            return f"🔵{self.orbs}" if self.orbs > 0 else "⚫"

class ChainReactionGame:
    def __init__(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        self.board = [[Cell() for _ in range(cols)] for _ in range(rows)]
        self.current_player = Player.RED
        self.game_over = False
        self.winner = None
        self.move_count = 0
        self._initialize_critical_mass_cache()
    
    def _initialize_critical_mass_cache(self):
        """Pre-calculate critical mass for each position"""
        self.critical_mass_cache = {}
        for row in range(self.rows):
            for col in range(self.cols):
                neighbors = 0
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = row + dr, col + dc
                    if 0 <= nr < self.rows and 0 <= nc < self.cols:
                        neighbors += 1
                self.critical_mass_cache[(row, col)] = neighbors
    
    def get_critical_mass(self, row: int, col: int) -> int:
        """Get critical mass for a position (number of neighbors)"""
        return self.critical_mass_cache.get((row, col), 0)
    
    def is_valid_move(self, row: int, col: int, player: Player) -> bool:
        """Check if a move is valid"""
        if not (0 <= row < self.rows and 0 <= col < self.cols):
            return False
         
        cell = self.board[row][col]
        return cell.player == Player.EMPTY or cell.player == player
    
    def get_valid_moves(self, player: Player) -> List[Tuple[int, int]]:
        """Get all valid moves for a player"""
        moves = []
        for row in range(self.rows):
            for col in range(self.cols):
                if self.is_valid_move(row, col, player):
                    moves.append((row, col))
        return moves
    
    def make_move(self, row: int, col: int, player: Player) -> bool:
        """Make a move and handle explosions"""
        if not self.is_valid_move(row, col, player) or self.game_over:
            return False

        self.board[row][col].orbs += 1
        self.board[row][col].player = player
        self.move_count += 1
        
        # Handle explosions with improved logic
        self._handle_explosions()
        
        # Check win condition after explosions
        self._check_win_condition()
        
        # Switch player if game is not over
        if not self.game_over:
            self.current_player = Player.BLUE if self.current_player == Player.RED else Player.RED
        return True
    
    def _handle_explosions(self):
        """Handle chain explosions with game-over checking to prevent infinite loops"""
        explosion_occurred = True
        iteration_count = 0
        max_iterations = 1000000  # Safety limit
        
        while explosion_occurred and iteration_count < max_iterations:
            explosion_occurred = False
            iteration_count += 1
            
            # Find all cells that need to explode
            exploding_cells = []
            for row in range(self.rows):
                for col in range(self.cols):
                    cell = self.board[row][col]
                    critical_mass = self.get_critical_mass(row, col)
                    if cell.orbs >= critical_mass and cell.player != Player.EMPTY:
                        exploding_cells.append((row, col))
            
            if exploding_cells:
                explosion_occurred = True  # Set flag only if we have explosions
                
                # Process explosions with small delay for visual effect
                # print(f"💥 Processing {len(exploding_cells)} explosions...")
                
                # Add small delay for explosion visualization (only in interactive mode)
                # Don't add delay for AI calculations to maintain performance
                if hasattr(self, 'interactive_mode') and self.interactive_mode:
                    time.sleep(0.1)  # Very small delay for explosion visualization
                
                for row, col in exploding_cells:
                    self._explode_cell(row, col)
                
                # CRITICAL: Check if game is over during explosion handling
                if self._is_game_over_during_explosions():
                    # Game over detected - break out of explosion loop
                    break
        
        if iteration_count >= max_iterations:
            print(f"⚠️  Explosion loop terminated after {max_iterations} iterations for safety")
    
    def _is_game_over_during_explosions(self) -> bool:
        """Check if game is over during explosion processing"""
        red_orbs = 0
        blue_orbs = 0
        
        for row in range(self.rows):
            for col in range(self.cols):
                cell = self.board[row][col]
                if cell.player == Player.RED:
                    red_orbs += cell.orbs
                elif cell.player == Player.BLUE:
                    blue_orbs += cell.orbs
        
        # Game is over if one player has orbs AND the other has none (indicating elimination)
        # Only check after both players have had a chance to play (move_count > 2)
        total_orbs = red_orbs + blue_orbs
        if total_orbs > 0 and self.move_count > 2:
            # Game over when one player has orbs AND the other has none
            return (red_orbs == 0 and blue_orbs > 0) or (blue_orbs == 0 and red_orbs > 0)
        
        return False
    
    def _explode_cell(self, row: int, col: int):
        """Explode a single cell"""
        cell = self.board[row][col]
        exploding_player = cell.player
        critical_mass = self.get_critical_mass(row, col)
        
        # Calculate orbs to distribute (use critical mass, not all orbs)
        orbs_to_distribute = critical_mass
        
        # Reduce orbs in exploding cell by critical mass
        cell.orbs -= orbs_to_distribute
        if cell.orbs <= 0:
            cell.orbs = 0
            cell.player = Player.EMPTY
        
        # Distribute orbs to neighbors (1 orb to each neighbor)
        neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        for dr, dc in neighbors:
            nr, nc = row + dr, col + dc
            if 0 <= nr < self.rows and 0 <= nc < self.cols:
                neighbor_cell = self.board[nr][nc]
                neighbor_cell.orbs += 1
                neighbor_cell.player = exploding_player
    
    def _check_win_condition(self):
        """Check if game is over and determine winner"""
        red_orbs = 0
        blue_orbs = 0
        
        for row in range(self.rows):
            for col in range(self.cols):
                cell = self.board[row][col]
                if cell.player == Player.RED:
                    red_orbs += cell.orbs
                elif cell.player == Player.BLUE:
                    blue_orbs += cell.orbs
        
        total_orbs = red_orbs + blue_orbs
        
        # Game is over if there are orbs on the board and one player has no orbs
        # But only after both players have made at least one move (move_count >= 2)
        if total_orbs > 0 and self.move_count >= 2:
            if red_orbs > 0 and blue_orbs == 0:
                self.game_over = True
                self.winner = Player.RED
            elif blue_orbs > 0 and red_orbs == 0:
                self.game_over = True
                self.winner = Player.BLUE
    
    def get_score(self) -> Dict[Player, int]:
        """Get current score for each player"""
        scores = {Player.RED: 0, Player.BLUE: 0}
        for row in range(self.rows):
            for col in range(self.cols):
                cell = self.board[row][col]
                if cell.player in scores:
                    scores[cell.player] += cell.orbs
        return scores
    
    def display_board(self):
        """Display the current board state"""
        print("\nCurrent Board:")
        for row in range(self.rows):
            print(' '.join(str(self.board[row][col]) for col in range(self.cols)))
        
        scores = self.get_score()
        print(f"\nScores - Red: {scores[Player.RED]}, Blue: {scores[Player.BLUE]}")
        print(f"Current Player: {self.current_player.value}")
    
    def copy(self):
        """Create a deep copy of the game state"""
        new_game = ChainReactionGame(self.rows, self.cols)
        new_game.current_player = self.current_player
        new_game.game_over = self.game_over
        new_game.winner = self.winner
        new_game.move_count = self.move_count
        
        for row in range(self.rows):
            for col in range(self.cols):
                new_game.board[row][col].orbs = self.board[row][col].orbs
                new_game.board[row][col].player = self.board[row][col].player
        
        return new_game
    
    def to_file_format(self, move_type: str) -> str:
        """Convert board to file format with game state metadata"""
        lines = [f"{move_type}:"]
        if self.move_count == 0:
            # Game just started - no one has moved yet, set last player as Blue so Red goes first
            last_player = Player.BLUE
        else:
            # Someone has moved - the last player is the opposite of current player
            last_player = Player.BLUE if self.current_player == Player.RED else Player.RED
        
        lines.append(f"LastPlayer: {last_player.value}")
        lines.append(f"MoveCount: {self.move_count}")
        lines.append(f"GameOver: {self.game_over}")
        if self.winner:
            lines.append(f"Winner: {self.winner.value}")
        lines.append("Board:")
        for row in range(self.rows):
            line = ' '.join(str(self.board[row][col]) for col in range(self.cols))
            lines.append(line)
        return '\n'.join(lines)
    
    def save_to_file(self, filename: str, move_type: str):
        """Save game state to file"""
        with open(filename, 'w') as f:
            f.write(self.to_file_format(move_type))
    
    @classmethod
    def load_from_file(cls, filename: str) -> 'ChainReactionGame':
        """Load game state from file with metadata"""
        try:
            with open(filename, 'r') as f:
                content = f.read().strip()
            
            lines = content.split('\n')
            if not lines:
                raise ValueError("Empty file")
            
            # Parse header (e.g., "Game Start:", "Human Move:", etc.)
            header = lines[0]
            
            # Parse metadata and find board start
            metadata = {}
            board_start_idx = 1
            
            for i, line in enumerate(lines[1:], 1):
                if line.startswith("LastPlayer:"):
                    metadata['last_player'] = line.split(": ", 1)[1]
                elif line.startswith("MoveCount:"):
                    metadata['move_count'] = int(line.split(": ", 1)[1])
                elif line.startswith("GameOver:"):
                    metadata['game_over'] = line.split(": ", 1)[1].lower() == 'true'
                elif line.startswith("Winner:"):
                    metadata['winner'] = line.split(": ", 1)[1]
                elif line.startswith("Board:"):
                    board_start_idx = i + 1
                    break
                elif line and not line.startswith(("LastPlayer:", "MoveCount:", "GameOver:", "Winner:", "Board:")):
                    board_start_idx = i
                    break
            
            board_lines = lines[board_start_idx:]
            
            if not board_lines:
                raise ValueError("No board data found")
            
            # Determine board dimensions from the first data line
            first_line_cells = board_lines[0].split()
            cols = len(first_line_cells)
            rows = len(board_lines)
            
            # Create new game instance
            game = cls(rows, cols)
            
            # Parse board state
            for row_idx, line in enumerate(board_lines):
                cells = line.split()
                if len(cells) != cols:
                    raise ValueError(f"Inconsistent column count in row {row_idx}")
                
                for col_idx, cell_str in enumerate(cells):
                    # Parse cell format (e.g., "🔵2", "⚫", "🔴1")
                    if cell_str == "⚫":
                        # Empty cell
                        game.board[row_idx][col_idx].orbs = 0
                        game.board[row_idx][col_idx].player = Player.EMPTY
                    elif cell_str.startswith("🔴"):
                        # Red player cell
                        orbs = int(cell_str[1:]) if len(cell_str) > 1 else 1
                        game.board[row_idx][col_idx].orbs = orbs
                        game.board[row_idx][col_idx].player = Player.RED
                    elif cell_str.startswith("🔵"):
                        # Blue player cell
                        orbs = int(cell_str[1:]) if len(cell_str) > 1 else 1
                        game.board[row_idx][col_idx].orbs = orbs
                        game.board[row_idx][col_idx].player = Player.BLUE
                    else:
                        # Handle numeric format (fallback for compatibility)
                        if cell_str == "0":
                            game.board[row_idx][col_idx].orbs = 0
                            game.board[row_idx][col_idx].player = Player.EMPTY
                        elif cell_str.endswith('R'):
                            orbs = int(cell_str[:-1])
                            game.board[row_idx][col_idx].orbs = orbs
                            game.board[row_idx][col_idx].player = Player.RED
                        elif cell_str.endswith('B'):
                            orbs = int(cell_str[:-1])
                            game.board[row_idx][col_idx].orbs = orbs
                            game.board[row_idx][col_idx].player = Player.BLUE
                        else:
                            raise ValueError(f"Invalid cell format: {cell_str}")
            
            # Restore game state from metadata if available, otherwise use board analysis
            if metadata:
                game._restore_game_state_from_metadata(metadata)
            else:
                game._restore_game_state_from_board()
            
            return game
            
        except FileNotFoundError:
            raise FileNotFoundError(f"Game state file '{filename}' not found")
        except Exception as e:
            raise ValueError(f"Error loading game state: {str(e)}")
    
    def _restore_game_state_from_metadata(self, metadata: dict):
        """Restore game state from metadata (preferred method)"""
        # Restore move count
        self.move_count = metadata.get('move_count', 0)
        
        # DON'T restore game_over and winner blindly - validate them based on actual board state
        # This prevents incorrect winner declarations from corrupted save files
        
        # Determine current player based on who made the last move
        last_player_str = metadata.get('last_player')
        if last_player_str:
            last_player = Player.RED if last_player_str == "Red" else Player.BLUE
            # Current player is the opposite of who made the last move
            self.current_player = Player.BLUE if last_player == Player.RED else Player.RED
        else:
            # Fallback to board analysis
            self._restore_game_state_from_board()
        
        # Validate and set game_over and winner based on actual board state
        self._check_win_condition()
    
    def _restore_game_state_from_board(self):
        """Restore game state properties from board data (fallback method)"""
        # Count total orbs for each player
        red_orbs = 0
        blue_orbs = 0
        
        for row in range(self.rows):
            for col in range(self.cols):
                cell = self.board[row][col]
                if cell.player == Player.RED:
                    red_orbs += cell.orbs
                elif cell.player == Player.BLUE:
                    blue_orbs += cell.orbs
        
        self.move_count = red_orbs + blue_orbs

        # If move count is even, it's Red's turn; if odd, it's Blue's turn
        self.current_player = Player.RED if self.move_count % 2 == 0 else Player.BLUE
        
        # Check win condition
        self._check_win_condition()
        
class ChainReactionHeuristics:
    @staticmethod
    def orb_count_heuristic(game: ChainReactionGame, player: Player) -> float:
        """Simple orb count difference"""
        scores = game.get_score()
        opponent = Player.BLUE if player == Player.RED else Player.RED
        return scores[player] - scores[opponent]
    
    @staticmethod
    def explosion_potential_heuristic(game: ChainReactionGame, player: Player) -> float:
        """Evaluates potential chain reaction opportunities"""
        score = 0
        opponent = Player.BLUE if player == Player.RED else Player.RED
        
        for row in range(game.rows):
            for col in range(game.cols):
                cell = game.board[row][col]
                critical = game.get_critical_mass(row, col)
                
                if cell.player == player:
                    # Immediate explosion potential
                    if cell.orbs == critical - 1:
                        score += 50
                    # Multiplier for chain reaction potential
                    neighbor_bonus = 0
                    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                        nr, nc = row + dr, col + dc
                        if 0 <= nr < game.rows and 0 <= nc < game.cols:
                            neighbor = game.board[nr][nc]
                            if neighbor.player == opponent and neighbor.orbs > 0:
                                neighbor_bonus += 15  # Conversion bonus
                            elif neighbor.player == player:
                                neighbor_bonus += 5   # Reinforcement bonus
                    score += neighbor_bonus * (cell.orbs / critical)
                
                elif cell.player == opponent:
                    # Penalize opponent's explosion potential
                    if cell.orbs == critical - 1:
                        score -= 60  # Higher penalty for opponent threats
        return score

    @staticmethod
    def strategic_control_heuristic(game: ChainReactionGame, player: Player) -> float:
        """Measures control of key board regions and choke points"""
        score = 0
        opponent = Player.BLUE if player == Player.RED else Player.RED
        center_row, center_col = game.rows // 2, game.cols // 2
        
        for row in range(game.rows):
            for col in range(game.cols):
                cell = game.board[row][col]
                dist_to_center = abs(row - center_row) + abs(col - center_col)
                
                if cell.player == player:
                    # Center control bonus (quadratic decay)
                    center_bonus = max(0, 20 - 2 * (dist_to_center ** 1.5))
                    # Choke point bonus (edge cells adjacent to corners)
                    is_choke = False
                    if (row == 0 and col == 1) or (row == 1 and col == 0) or \
                       (row == 0 and col == game.cols-2) or (row == 1 and col == game.cols-1) or \
                       (row == game.rows-2 and col == 0) or (row == game.rows-1 and col == 1) or \
                       (row == game.rows-2 and col == game.cols-1) or (row == game.rows-1 and col == game.cols-2):
                        is_choke = True
                    
                    score += center_bonus + (30 if is_choke else 0)
                
                elif cell.player == opponent:
                    score -= max(0, 15 - 2 * (dist_to_center ** 1.5))
        return score

    @staticmethod
    def growth_potential_heuristic(game: ChainReactionGame, player: Player) -> float:
        """Evaluates safe expansion opportunities"""
        score = 0
        opponent = Player.BLUE if player == Player.RED else Player.RED
        frontier_cells = set()
        
        # Identify frontier (empty cells adjacent to player's cells)
        for row in range(game.rows):
            for col in range(game.cols):
                if game.board[row][col].player == player:
                    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                        nr, nc = row + dr, col + dc
                        if 0 <= nr < game.rows and 0 <= nc < game.cols:
                            if game.board[nr][nc].player == Player.EMPTY:
                                frontier_cells.add((nr, nc))
        
        # Evaluate each frontier cell's potential
        for row, col in frontier_cells:
            safety_score = 0
            strategic_value = 0
            
            # Check safety (opponent's ability to attack)
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr, nc = row + dr, col + dc
                if 0 <= nr < game.rows and 0 <= nc < game.cols:
                    neighbor = game.board[nr][nc]
                    if neighbor.player == opponent:
                        critical = game.get_critical_mass(nr, nc)
                        safety_score -= (neighbor.orbs / critical) * 40
            
            # Strategic value based on position
            if (row == 0 or row == game.rows-1) and (col == 0 or col == game.cols-1):
                strategic_value = 25  # Corner
            elif row == 0 or row == game.rows-1 or col == 0 or col == game.cols-1:
                strategic_value = 15  # Edge
            else:
                strategic_value = 5   # Center
            
            score += max(0, strategic_value + safety_score)
        
        return score

    @staticmethod
    def threat_analysis_heuristic(game: ChainReactionGame, player: Player) -> float:
        """Advanced threat detection and response evaluation"""
        score = 0
        opponent = Player.BLUE if player == Player.RED else Player.RED
        immediate_threats = 0
        potential_threats = 0
        
        for row in range(game.rows):
            for col in range(game.cols):
                cell = game.board[row][col]
                critical = game.get_critical_mass(row, col)
                
                if cell.player == opponent:
                    # Immediate threats (will explode next turn)
                    if cell.orbs == critical - 1:
                        immediate_threats += 1
                        # Evaluate our ability to block
                        can_block = False
                        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                            nr, nc = row + dr, col + dc
                            if 0 <= nr < game.rows and 0 <= nc < game.cols:
                                if game.board[nr][nc].player == player:
                                    can_block = True
                                    break
                        score -= 50 if not can_block else 25
                    
                    # Potential threats (could explode soon)
                    elif cell.orbs >= critical * 0.7:
                        potential_threats += 1
                        score -= 20 * (cell.orbs / critical)
                
                elif cell.player == player:
                    # Our defensive formations
                    if cell.orbs > 0:
                        defensive_strength = 0
                        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                            nr, nc = row + dr, col + dc
                            if 0 <= nr < game.rows and 0 <= nc < game.cols:
                                neighbor = game.board[nr][nc]
                                if neighbor.player == player:
                                    defensive_strength += neighbor.orbs
                        score += min(30, defensive_strength * 2)
        
        # Global threat assessment
        threat_ratio = (immediate_threats * 3 + potential_threats) / max(1, game.rows * game.cols)
        score -= 100 * threat_ratio
        
        return score

    @staticmethod
    def tempo_heuristic(game: ChainReactionGame, player: Player) -> float:
        """Measures initiative and turn advantage"""
        score = 0
        opponent = Player.BLUE if player == Player.RED else Player.RED
        
        # Count forcing moves (moves that create immediate threats)
        player_forcing_moves = 0
        opponent_forcing_moves = 0
        
        for row in range(game.rows):
            for col in range(game.cols):
                cell = game.board[row][col]
                critical = game.get_critical_mass(row, col)
                
                if cell.player == player and cell.orbs == critical - 2:
                    player_forcing_moves += 1
                elif cell.player == opponent and cell.orbs == critical - 2:
                    opponent_forcing_moves += 1
        
        # Evaluate board development
        player_development = sum(cell.orbs for row in game.board for cell in row if cell.player == player)
        opponent_development = sum(cell.orbs for row in game.board for cell in row if cell.player == opponent)
        development_ratio = player_development / max(1, opponent_development)
        
        # Calculate tempo score
        score += (player_forcing_moves - opponent_forcing_moves) * 40
        score += math.log(development_ratio) * 30 if development_ratio > 0 else 0
        
        # Late-game adjustment
        total_orbs = player_development + opponent_development
        if total_orbs > (game.rows * game.cols * 2):
            # In endgame, prioritize orb count and explosion potential
            score += ChainReactionHeuristics.orb_count_heuristic(game, player) * 0.5
            score += ChainReactionHeuristics.explosion_potential_heuristic(game, player) * 0.3
        
        return score

    @staticmethod
    def combined_heuristic_v2(game: ChainReactionGame, player: Player) -> float:
        """Sophisticated combination of all heuristics with dynamic weights"""
        # Early game weights
        if game.move_count < 10:
            weights = {
                'strategic_control': 0.4,
                'growth_potential': 0.3,
                'tempo': 0.2,
                'threat': 0.1
            }
        # Mid game weights
        elif game.move_count < 30:
            weights = {
                'explosion': 0.3,
                'threat': 0.3,
                'strategic_control': 0.2,
                'tempo': 0.2
            }
        # End game weights
        else:
            weights = {
                'explosion': 0.5,
                'threat': 0.3,
                'orb_count': 0.2
            }
        
        # Calculate weighted sum
        score = 0
        score += weights.get('explosion', 0) * ChainReactionHeuristics.explosion_potential_heuristic(game, player)
        score += weights.get('strategic_control', 0) * ChainReactionHeuristics.strategic_control_heuristic(game, player)
        score += weights.get('growth_potential', 0) * ChainReactionHeuristics.growth_potential_heuristic(game, player)
        score += weights.get('threat', 0) * ChainReactionHeuristics.threat_analysis_heuristic(game, player)
        score += weights.get('tempo', 0) * ChainReactionHeuristics.tempo_heuristic(game, player)
        score += weights.get('orb_count', 0) * ChainReactionHeuristics.orb_count_heuristic(game, player)
        
        return score

class MinimaxAI:
    def __init__(self, player: Player, depth: int = 3, heuristic_func=None):
        self.player = player
        self.depth = depth
        self.heuristic_func = heuristic_func or ChainReactionHeuristics.orb_count_heuristic
        self.nodes_evaluated = 0
        self.nodes_pruned = 0
        self.total_moves_considered = 0
        self.cache_hits = 0
        self.transposition_table = {}
        self.max_nodes = 750000  # Conservative node limit
        self.search_start_time = 0
        self.max_search_time = 25.0  # Conservative time limit

    def get_game_state_key(self, game: ChainReactionGame) -> tuple:
        """Generate a hashable key for the game state"""
        state = tuple((cell.orbs, cell.player.value) for row in game.board for cell in row)
        return (state, game.current_player.value)

    def minimax_search(self, game: ChainReactionGame, depth: int, 
                      alpha: float = float('-inf'), beta: float = float('inf'), 
                      maximizing: bool = True) -> Tuple[float, Optional[Tuple[int, int]]]:
        self.nodes_evaluated += 1
        
        # Time and node limits for safety
        if (time.time() - self.search_start_time > self.max_search_time or 
            self.nodes_evaluated > self.max_nodes):
            return self.heuristic_func(game, self.player), None
        
        # Generate state key for caching
        state_key = self.get_game_state_key(game)
        
        # Check transposition table
        if state_key in self.transposition_table:
            cached_score, cached_depth, cached_move = self.transposition_table[state_key]
            if cached_depth >= depth:
                self.cache_hits += 1
                return cached_score, cached_move
        
        # Base cases: depth 0 or game over
        if depth == 0 or game.game_over:
            if game.game_over:
                score = 1000 if game.winner == self.player else (-1000 if game.winner is not None else 0)
            else:
                score = self.heuristic_func(game, self.player)
            self.transposition_table[state_key] = (score, depth, None)
            return score, None
        
        # Determine current player
        current_player = self.player if maximizing else (Player.BLUE if self.player == Player.RED else Player.RED)
        valid_moves = game.get_valid_moves(current_player)
        
        # No valid moves - this is a terminal position, return win/loss score
        if not valid_moves:
            # If current player has no moves, they lose
            if current_player == self.player:
                score = -1000  # We lose
            else:
                score = 1000   # Opponent loses, we win
            self.transposition_table[state_key] = (score, depth, None)
            return score, None
        
        # Order moves for better pruning
        valid_moves = self.order_moves(game, valid_moves)
        best_move = None
        moves_evaluated = 0
        
        if maximizing:
            max_eval = float('-inf')
            for move in valid_moves:
                if (time.time() - self.search_start_time > self.max_search_time or 
                    self.nodes_evaluated > self.max_nodes):
                    break
                    
                self.total_moves_considered += 1
                moves_evaluated += 1
                
                # Make move on copy
                game_copy = game.copy()
                game_copy.make_move(move[0], move[1], current_player)
                
                # Recursive call
                eval_score, _ = self.minimax_search(game_copy, depth - 1, alpha, beta, False)
                
                if eval_score > max_eval:
                    max_eval = eval_score
                    best_move = move
                    
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    self.nodes_pruned += len(valid_moves) - moves_evaluated
                    break
                    
            self.transposition_table[state_key] = (max_eval, depth, best_move)
            return max_eval, best_move
        else:
            min_eval = float('inf')
            for move in valid_moves:
                if (time.time() - self.search_start_time > self.max_search_time or 
                    self.nodes_evaluated > self.max_nodes):
                    break
                    
                self.total_moves_considered += 1
                moves_evaluated += 1
                
                # Make move on copy
                game_copy = game.copy()
                game_copy.make_move(move[0], move[1], current_player)
                
                # Recursive call
                eval_score, _ = self.minimax_search(game_copy, depth - 1, alpha, beta, True)
                
                if eval_score < min_eval:
                    min_eval = eval_score
                    best_move = move
                    
                beta = min(beta, eval_score)
                if beta <= alpha:
                    self.nodes_pruned += len(valid_moves) - moves_evaluated
                    break
                    
            self.transposition_table[state_key] = (min_eval, depth, best_move)
            return min_eval, best_move

    def get_best_move(self, game: ChainReactionGame) -> Optional[Tuple[int, int]]:
        self.nodes_evaluated = 0
        self.nodes_pruned = 0
        self.total_moves_considered = 0
        self.cache_hits = 0
        self.transposition_table.clear()
        self.search_start_time = time.time()
        
        total_orbs = sum(cell.orbs for row in game.board for cell in row if cell.player != Player.EMPTY)
        valid_moves_count = len(game.get_valid_moves(self.player))
        print(f"🎯 AI searching at depth {self.depth} for {total_orbs} orbs, {valid_moves_count} valid moves")
        
        _, best_move = self.minimax_search(game, self.depth)
        
        search_time = time.time() - self.search_start_time
        pruning_rate = (self.nodes_pruned / max(self.total_moves_considered, 1)) * 100 if self.total_moves_considered > 0 else 0
        cache_hit_rate = (self.cache_hits / max(self.nodes_evaluated, 1)) * 100 if self.nodes_evaluated > 0 else 0
        print(f"⚡ Search completed in {search_time:.2f}s with {self.nodes_evaluated:,} nodes, {self.nodes_pruned:,} pruned ({pruning_rate:.1f}% efficiency), {self.cache_hits:,} hits ({cache_hit_rate:.1f}% hit rate)")
        return best_move
    
    def order_moves(self, game: ChainReactionGame, moves: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        """Order moves by proximity to critical mass for better pruning"""
        def move_score(move):
            row, col = move
            cell = game.board[row][col]
            critical = game.get_critical_mass(row, col)
            if critical > 0:
                return cell.orbs / critical
            return 0
        return sorted(moves, key=move_score, reverse=True)

class RandomAI:
    """Simple AI that makes random valid moves"""
    
    def __init__(self, player: Player):
        self.player = player
    
    def get_best_move(self, game: ChainReactionGame) -> Optional[Tuple[int, int]]:
        """Get a random valid move"""
        valid_moves = game.get_valid_moves(self.player)
        if not valid_moves:
            return None
        
        # Remove artificial delay for web interface to match direct execution speed
        # time.sleep(0.1)  # Removed: No delay needed for web interface
        
        # Select a random move
        move = random.choice(valid_moves)
        print(f"🎲 Random AI selected move: {move[0]}, {move[1]}")
        return move

class GameController:
    def __init__(self):
        self.game = None
        self.ai_red = None
        self.ai_blue = None
        self.start_time = None
        self.game_state_file = "improved_gamestate.txt"  # File-based backend
    
    def get_game_configuration(self) -> Tuple[int, int, int, AIType, AIType, GameMode, Optional[callable], Optional[callable]]:
        """Get game configuration from user"""
        print("🎮 Improved Chain Reaction Game")
        # print("🚀 Features: Game-over detection during explosions (no infinite loops!)")
        print("=" * 60)
        
        # Get grid size
        print("\n🔲 Grid Size Configuration:")
        while True:
            try:
                rows = int(input("Enter number of rows (3-10): "))
                if 3 <= rows <= 10:
                    break
                else:
                    print("Invalid input. Please enter a number between 3 and 10.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        
        while True:
            try:
                cols = int(input("Enter number of columns (3-10): "))
                if 3 <= cols <= 10:
                    break
                else:
                    print("Invalid input. Please enter a number between 3 and 10.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        
        # Get game mode first to determine what AI config we need
        print("\n🎯 Game Mode Selection:")
        print("1. User vs User")
        print("2. User vs AI")
        print("3. AI vs AI")
        
        while True:
            try:
                mode_choice = int(input("Select game mode (1-3): "))
                if mode_choice in [1, 2, 3]:
                    break
                else:
                    print("Invalid choice. Please enter 1, 2, or 3.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        
        # Get AI difficulty (only for smart AI)
        print("\n🤖 Smart AI Difficulty Configuration:")
        print("2 - Easy (Fast)")
        print("3 - Medium (Balanced)")
        print("4 - Hard (Strategic)")
        
        while True:
            try:
                depth = int(input("Select Smart AI depth (2-4): "))
                if 2 <= depth <= 4:
                    break
                else:
                    print("Invalid input. Please enter 2, 3, or 4.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        
        # Configure AI types based on game mode
        def get_ai_type(player_name: str) -> AIType:
            print(f"\n{player_name} AI Type:")
            print("1 - Smart AI (Strategic Minimax)")
            print("2 - Random AI (Makes random moves)")
            
            while True:
                try:
                    choice = int(input(f"Select {player_name} AI type (1-2): "))
                    if choice == 1:
                        return AIType.SMART
                    elif choice == 2:
                        return AIType.RANDOM
                    else:
                        print("Invalid choice. Please enter 1 or 2.")
                except ValueError:
                    print("Invalid input. Please enter a number.")
        
        def get_heuristic_choice(player_name: str):
            """Get heuristic function choice for Smart AI"""
            print(f"\n🧠 {player_name} Smart AI Heuristic Selection:")
            print("1 - Orb Count (Simple orb difference)")
            print("2 - Explosion Potential (Chain reaction focus)")
            print("3 - Strategic Control (Board position control)")
            print("4 - Growth Potential (Safe expansion)")
            print("5 - Threat Analysis (Defensive play)")
            print("6 - Tempo (Initiative and forcing moves)")
            print("7 - Combined v2 (Adaptive multi-heuristic)")
            
            while True:
                try:
                    choice = int(input(f"Select {player_name} AI heuristic (1-7): "))
                    if choice == 1:
                        return ChainReactionHeuristics.orb_count_heuristic
                    elif choice == 2:
                        return ChainReactionHeuristics.explosion_potential_heuristic
                    elif choice == 3:
                        return ChainReactionHeuristics.strategic_control_heuristic
                    elif choice == 4:
                        return ChainReactionHeuristics.growth_potential_heuristic
                    elif choice == 5:
                        return ChainReactionHeuristics.threat_analysis_heuristic
                    elif choice == 6:
                        return ChainReactionHeuristics.tempo_heuristic
                    elif choice == 7:
                        return ChainReactionHeuristics.combined_heuristic_v2
                    else:
                        print("Invalid choice. Please enter 1-7.")
                except ValueError:
                    print("Invalid input. Please enter a number.")
        
        if mode_choice == 1:  # User vs User
            red_ai_type = None 
            blue_ai_type = None
            red_heuristic = None
            blue_heuristic = None
        elif mode_choice == 2:  # User vs AI  
            print("\n🤖 AI Opponent Configuration:")
            red_ai_type = None  # Red is human, so this won't be used
            blue_ai_type = get_ai_type("Blue")
            red_heuristic = None
            
            # Get heuristic for Blue AI if it's Smart AI
            if blue_ai_type == AIType.SMART:
                blue_heuristic = get_heuristic_choice("Blue")
            else:
                blue_heuristic = None
        else:  # AI vs AI
            print("\n🤖 AI Configuration:")
            red_ai_type = get_ai_type("Red")
            blue_ai_type = get_ai_type("Blue")
            
            # Get heuristics for Smart AIs
            if red_ai_type == AIType.SMART:
                red_heuristic = get_heuristic_choice("Red")
            else:
                red_heuristic = None
                
            if blue_ai_type == AIType.SMART:
                blue_heuristic = get_heuristic_choice("Blue")
            else:
                blue_heuristic = None
        
        return rows, cols, depth, red_ai_type, blue_ai_type, GameMode(mode_choice), red_heuristic, blue_heuristic
    
    def initialize_game(self, rows: int, cols: int, depth: int, red_ai_type: AIType, blue_ai_type: AIType, red_heuristic=None, blue_heuristic=None):
        """Initialize game with specified configuration"""
        self.game = ChainReactionGame(rows, cols)
        
        # Create AI instances based on type selection
        if red_ai_type == AIType.SMART:
            # Use user-selected heuristic or default to growth_potential_heuristic
            heuristic = red_heuristic or ChainReactionHeuristics.growth_potential_heuristic
            self.ai_red = MinimaxAI(Player.RED, depth=depth, heuristic_func=heuristic)
        elif red_ai_type == AIType.RANDOM:
            self.ai_red = RandomAI(Player.RED)
        else:
            self.ai_red = None
            
        if blue_ai_type == AIType.SMART:
            # Use user-selected heuristic or default to threat_analysis_heuristic
            heuristic = blue_heuristic or ChainReactionHeuristics.threat_analysis_heuristic
            self.ai_blue = MinimaxAI(Player.BLUE, depth=depth, heuristic_func=heuristic)
        elif blue_ai_type == AIType.RANDOM:
            self.ai_blue = RandomAI(Player.BLUE)
        else:
            self.ai_blue = None
        
        print(f"\n✅ Improved game initialized: {rows}x{cols} grid")
        if red_ai_type:
            print(f"🔴 Red AI: {red_ai_type.value}")
            if red_ai_type == AIType.SMART and red_heuristic:
                print(f"  📈 Red AI Heuristic: {red_heuristic.__name__.replace('_heuristic', '').replace('_', ' ').title()}")
        if blue_ai_type:    
            print(f"🔵 Blue AI: {blue_ai_type.value}")
            if blue_ai_type == AIType.SMART and blue_heuristic:
                print(f"  📈 Blue AI Heuristic: {blue_heuristic.__name__.replace('_heuristic', '').replace('_', ' ').title()}")
        if red_ai_type == AIType.SMART or blue_ai_type == AIType.SMART:
            print(f"🎯 Smart AI depth: {depth}")
    
    def get_game_mode(self) -> GameMode:
        """Get game mode from user"""
        print("\n🎯 Game Mode Selection:")
        print("1. User vs User")
        print("2. User vs AI")
        print("3. AI vs AI")
        
        while True:
            try:
                choice = int(input("Select game mode (1-3): "))
                if choice in [1, 2, 3]:
                    return GameMode(choice)
                else:
                    print("Invalid choice. Please enter 1, 2, or 3.")
            except ValueError:
                print("Invalid input. Please enter a number.")
    
    def get_user_move(self, player: Player) -> Tuple[int, int]:
        """Get move from user with immediate validation"""
        while True:
            try:
                print(f"\n{player.value} player's turn")
                move_input = input("Enter move as 'row col' (0-indexed, e.g., '0 1'): ")
                row, col = map(int, move_input.strip().split())
                
                # Immediate validation for better user experience
                if not (0 <= row < self.game.rows and 0 <= col < self.game.cols):
                    print(f"❌ Invalid position! Row must be 0-{self.game.rows-1}, column must be 0-{self.game.cols-1}")
                    continue
                    
                if not self.game.is_valid_move(row, col, player):
                    cell = self.game.board[row][col]
                    if cell.player != Player.EMPTY and cell.player != player:
                        print(f"❌ That cell belongs to {cell.player.value}! You can only place on empty cells or your own cells.")
                    continue
                    
                return row, col
            except ValueError:
                print("❌ Invalid input. Please enter two numbers separated by a space.")
            except KeyboardInterrupt:
                print("\n👋 Game cancelled by user.")
                exit(0)

    def play_game(self):
        """Main game loop with file-based backend"""
        rows, cols, depth, red_ai_type, blue_ai_type, mode, red_heuristic, blue_heuristic = self.get_game_configuration()
        self.initialize_game(rows, cols, depth, red_ai_type, blue_ai_type, red_heuristic, blue_heuristic)
        
        self.start_time = time.time()
        
        # Save initial game state to file
        self.game.save_to_file(self.game_state_file, "Game Start")
        
        print(f"\n🚀 Starting {mode.name.replace('_', ' ').title()} game!")
        print("=" * 60)
        
        while True:
            # CRITICAL: Always read current state from file before each move
            try:
                self.game = ChainReactionGame.load_from_file(self.game_state_file)
            except (FileNotFoundError, ValueError) as e:
                print(f"❌ Error loading game state: {e}")
                break
            
            # Check if game is over
            if self.game.game_over:
                break
                
            self.game.display_board()
            
            current_player = self.game.current_player
            
            if mode == GameMode.USER_VS_USER:
                # Both players are human
                row, col = self.get_user_move(current_player)
                # Move is pre-validated, so this should always succeed
                self.game.make_move(row, col, current_player)
                # Save game state after human move
                move_type = f"Human Move ({current_player.value})"
                self.game.save_to_file(self.game_state_file, move_type)
                    
            elif mode == GameMode.USER_VS_AI:
                # Red is human, Blue is AI
                if current_player == Player.RED:
                    row, col = self.get_user_move(current_player)
                    # Move is pre-validated, so this should always succeed
                    self.game.make_move(row, col, current_player)
                    # Save game state after human move
                    self.game.save_to_file(self.game_state_file, "Human Move")
                else:
                    ai_type_name = blue_ai_type.value
                    print(f"\n🤖 {ai_type_name} ({current_player.value}) is thinking...")
                    # Reinitialize AI with current game state (since we loaded from file)
                    if blue_ai_type == AIType.SMART:
                        heuristic = blue_heuristic or ChainReactionHeuristics.threat_analysis_heuristic
                        ai_instance = MinimaxAI(Player.BLUE, depth, heuristic_func=heuristic)
                    else:
                        ai_instance = RandomAI(Player.BLUE)
                    
                    move = ai_instance.get_best_move(self.game)
                    if move and self.game.make_move(move[0], move[1], current_player):
                        print(f"{ai_type_name} plays: {move[0]}, {move[1]}")
                        # Save game state after AI move
                        self.game.save_to_file(self.game_state_file, f"{ai_type_name} Move")
                    else:
                        print(f"{ai_type_name} could not find a valid move!")
                        break
                        
            elif mode == GameMode.AI_VS_AI:
                # Both players are AI - reinitialize AI instances with current game state
                if current_player == Player.RED:
                    ai_type_name = red_ai_type.value
                    if red_ai_type == AIType.SMART:
                        heuristic = red_heuristic or ChainReactionHeuristics.growth_potential_heuristic
                        ai_instance = MinimaxAI(Player.RED, depth, heuristic_func=heuristic)
                    else:
                        ai_instance = RandomAI(Player.RED)
                else:
                    ai_type_name = blue_ai_type.value
                    if blue_ai_type == AIType.SMART:
                        heuristic = blue_heuristic or ChainReactionHeuristics.threat_analysis_heuristic
                        ai_instance = MinimaxAI(Player.BLUE, depth, heuristic_func=heuristic)
                    else:
                        ai_instance = RandomAI(Player.BLUE)
                
                print(f"\n🤖 {ai_type_name} ({current_player.value}) is thinking...")
                move = ai_instance.get_best_move(self.game)
                
                if move and self.game.make_move(move[0], move[1], current_player):
                    print(f"{ai_type_name} ({current_player.value}) plays: {move[0]}, {move[1]}")
                    # Save game state after AI move
                    ai_move_type = f"{ai_type_name} Move ({current_player.value})"
                    self.game.save_to_file(self.game_state_file, ai_move_type)
                    # Remove artificial delay for AI vs AI in web interface to match direct execution speed
                    # time.sleep(0.5)  # Removed: No delay needed for web interface
                else:
                    print(f"{ai_type_name} ({current_player.value}) could not find a valid move!")
                    break
        
        # Ensure we have the final state loaded
        try:
            self.game = ChainReactionGame.load_from_file(self.game_state_file)
        except (FileNotFoundError, ValueError):
            pass  # Use current state if loading fails
        
        # Game over - save final state
        self.game.save_to_file(self.game_state_file, "Game Over")
        
        self.game.display_board()
        elapsed_time = time.time() - self.start_time
        
        print("\n" + "=" * 50)
        print("🎊 GAME OVER! 🎊")
        if self.game.winner:
            print(f"🏆 Winner: {self.game.winner.value} Player!")
        else:
            print("🤝 It's a draw!")
        
        scores = self.game.get_score()
        print(f"📊 Final Scores - Red: {scores[Player.RED]}, Blue: {scores[Player.BLUE]}")
        print(f"⏱️  Game duration: {elapsed_time:.1f} seconds")
        print(f"📁 Game state saved to: {self.game_state_file}")
        print("=" * 50)

if __name__ == "__main__":
    controller = GameController()
    controller.play_game()
