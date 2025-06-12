# Bridge mode addition for improved_chain_reaction.py
# This file extends the existing backend to support communication with the frontend

import json
import sys
import os
import time
from improved_chain_reaction import *

class BridgeGameController(GameController):
    def __init__(self):
        super().__init__()
        self.bridge_mode = True
        self.config_file = "backend_config.json"
        
    def load_config(self):
        """Load configuration from JSON file"""
        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Config file {self.config_file} not found", file=sys.stderr)
            return None
        except json.JSONDecodeError:
            print(f"Invalid JSON in {self.config_file}", file=sys.stderr)
            return None
    
    def process_move_request(self):
        """Process a move request from the frontend"""
        try:
            # Read current game state
            if not os.path.exists(self.game_state_file):
                print("Game state file not found", file=sys.stderr)
                return False
                
            self.game = ChainReactionGame.load_from_file(self.game_state_file)
            
            # Check if it's an AI turn request
            with open(self.game_state_file, 'r') as f:
                content = f.read()
                if "AI Turn Request:" in content:
                    return self.make_ai_move()
                    
            return True
        except Exception as e:
            print(f"Error processing move request: {e}", file=sys.stderr)
            return False
    
    def make_ai_move(self):
        """Make an AI move and update the game state"""
        try:
            if not self.game:
                return False
                
            # Determine which AI to use
            config = self.load_config()
            if not config:
                return False
                
            current_player = self.game.current_player
            
            # Create appropriate AI based on configuration format
            ai_player = current_player  # Use the actual current player from game state
            
            # Handle AI vs AI mode with individual AI configurations
            if config.get('mode') == 'AI vs AI' and 'redAI' in config and 'blueAI' in config:
                # Use specific AI configuration based on current player
                if current_player.value == 'Red':
                    ai_config = config['redAI']
                else:
                    ai_config = config['blueAI']
                
                if ai_config.get('type') == 'Random':
                    ai = RandomAI(ai_player)
                else:
                    depth = self.get_difficulty_depth(ai_config.get('difficulty', 'Medium'))
                    heuristic_func = self.get_heuristic_function(ai_config.get('heuristic', 'combined_v2'))
                    ai = MinimaxAI(ai_player, depth, heuristic_func=heuristic_func)
            else:
                # Handle legacy single AI configuration
                if config.get('aiType') == 'Random':
                    ai = RandomAI(ai_player)
                else:
                    depth = self.get_difficulty_depth(config.get('difficulty', 'Medium'))
                    heuristic_func = self.get_heuristic_function(config.get('heuristic', 'combined_v2'))
                    ai = MinimaxAI(ai_player, depth, heuristic_func=heuristic_func)
            
            # Get AI move
            move = ai.get_best_move(self.game)
            if move:
                row, col = move
                success = self.game.make_move(row, col, current_player)
                
                if success:
                    # Save updated game state
                    move_type = f"AI {config.get('aiType', 'Smart')} Move"
                    self.game.save_to_file(self.game_state_file, move_type)
                    return True
                    
            return False
        except Exception as e:
            print(f"Error making AI move: {e}", file=sys.stderr)
            return False
    
    def get_difficulty_depth(self, difficulty):
        """Convert difficulty string to minimax depth"""
        difficulty_map = {
            'Easy': 2,
            'Medium': 3,
            'Hard': 4
        }
        return difficulty_map.get(difficulty, 3)
    
    def get_heuristic_function(self, heuristic_name):
        """Get heuristic function from name"""
        heuristic_map = {
            'orb_count': ChainReactionHeuristics.orb_count_heuristic,
            'explosion_potential': ChainReactionHeuristics.explosion_potential_heuristic,
            'strategic_control': ChainReactionHeuristics.strategic_control_heuristic,
            'growth_potential': ChainReactionHeuristics.growth_potential_heuristic,
            'threat_analysis': ChainReactionHeuristics.threat_analysis_heuristic,
            'tempo': ChainReactionHeuristics.tempo_heuristic,
            'combined_v2': ChainReactionHeuristics.combined_heuristic_v2
        }
        return heuristic_map.get(heuristic_name, ChainReactionHeuristics.combined_heuristic_v2)
    
    def run_bridge_mode(self):
        """Run in bridge mode - process commands from stdin"""
        print("Bridge mode started", file=sys.stderr)
        
        while True:
            try:
                # Wait for commands from the bridge server
                line = sys.stdin.readline().strip()
                
                if line == 'ai_move':
                    success = self.process_move_request()
                    if success:
                        print("AI move completed", file=sys.stderr)
                    else:
                        print("AI move failed", file=sys.stderr)
                elif line == 'process_move':
                    success = self.process_human_move()
                    if success:
                        print("Human move processed", file=sys.stderr)
                    else:
                        print("Human move processing failed", file=sys.stderr)
                elif line == 'process_ai_move':
                    success = self.process_ai_move()
                    if success:
                        print("AI move processed successfully", file=sys.stderr)
                    else:
                        print("AI move processing failed", file=sys.stderr)
                elif line == 'exit':
                    break
                elif line:
                    print(f"Unknown command: {line}", file=sys.stderr)
                    
            except EOFError:
                break
            except Exception as e:
                print(f"Error in bridge mode: {e}", file=sys.stderr)
                break
        
        print("Bridge mode ended", file=sys.stderr)
    
    def process_human_move(self):
        """Process a human move request from the frontend"""
        try:
            # Read the game state file
            if not os.path.exists(self.game_state_file):
                print("Game state file not found", file=sys.stderr)
                return False
            
            with open(self.game_state_file, 'r') as f:
                content = f.read()
            
            # Parse the human move request
            if "Human Move Request:" not in content:
                print("No human move request found", file=sys.stderr)
                return False
            
            lines = content.strip().split('\n')
            player_str = None
            row = None
            col = None
            
            for line in lines:
                if line.startswith('Player:'):
                    player_str = line.split(': ')[1].strip()
                elif line.startswith('Row:'):
                    row = int(line.split(': ')[1].strip())
                elif line.startswith('Col:'):
                    col = int(line.split(': ')[1].strip())
            
            if player_str is None or row is None or col is None:
                print("Invalid human move request format", file=sys.stderr)
                return False
            
            # Convert player string to Player enum
            from improved_chain_reaction import Player, ChainReactionGame
            player = Player.RED if player_str == 'RED' else Player.BLUE
            
            # Load or create game instance
            if self.game is None:
                # Try to use the game engine's load method first
                try:
                    # Write the content to a temporary format that the game engine can read
                    temp_content = self.convert_to_game_engine_format(content)
                    temp_file = self.game_state_file + '.temp'
                    with open(temp_file, 'w') as f:
                        f.write(temp_content)
                    self.game = ChainReactionGame.load_from_file(temp_file)
                    # Clean up temporary file
                    try:
                        os.remove(temp_file)
                    except:
                        pass
                except Exception as e:
                    print(f"Failed to load using game engine method: {e}", file=sys.stderr)
                    # Fallback to manual parsing
                    self.game = self.parse_game_state_from_file(content)
            
            if self.game is None:
                print("Failed to load game state", file=sys.stderr)
                return False
            
            # Make the move using the game engine
            print(f"Making move: {player_str} at ({row}, {col}), current player: {self.game.current_player.value}", file=sys.stderr)
            success = self.game.make_move(row, col, player)
            
            if not success:
                print(f"Invalid move: {player_str} at ({row}, {col})", file=sys.stderr)
                print(f"Game state: current_player={self.game.current_player.value}", file=sys.stderr)
                print(f"Cell state: orbs={self.game.board[row][col].orbs}, player={self.game.board[row][col].player.value}", file=sys.stderr)
                return False
            
            scores = self.game.get_score()
            total_orbs = scores[Player.RED] + scores[Player.BLUE]
            print(f"Move successful! Total orbs: {total_orbs}, game_over: {self.game.game_over}", file=sys.stderr)
            
            # Save the updated game state
            self.save_game_state()
            return True
            
        except Exception as e:
            print(f"Error processing human move: {e}", file=sys.stderr)
            return False
    
    def convert_to_game_engine_format(self, content):
        """Convert our format to the game engine's expected format"""
        lines = content.strip().split('\n')
        
        # Start with the proper header
        result_lines = ["Game State:"]
        
        # Find and copy metadata
        for line in lines:
            if line.startswith('LastPlayer:') or line.startswith('MoveCount:') or line.startswith('GameOver:') or line.startswith('Winner:'):
                result_lines.append(line)
            elif line.startswith('Board:'):
                result_lines.append(line)
                # Copy all board lines
                board_idx = lines.index(line)
                for board_line in lines[board_idx + 1:]:
                    if board_line.strip():
                        result_lines.append(board_line)
                break
        
        return '\n'.join(result_lines)
    
    def parse_game_state_from_file(self, content):
        """Parse game state from file content and create ChainReactionGame instance"""
        try:
            from improved_chain_reaction import ChainReactionGame, Player, Cell
            
            lines = content.strip().split('\n')
            board_start = -1
            
            # Find where the board starts
            for i, line in enumerate(lines):
                if line.strip() == 'Board:':
                    board_start = i + 1
                    break
            
            if board_start == -1:
                print("Board section not found in file", file=sys.stderr)
                return None
            
            # Parse board
            board_lines = []
            for i in range(board_start, len(lines)):
                line = lines[i].strip()
                if line:
                    board_lines.append(line)
            
            if not board_lines:
                print("No board data found", file=sys.stderr)
                return None
            
            # CRITICAL FIX: Get board dimensions from config file, NOT from parsing
            # This prevents dimension corruption that was causing 3x3 to become 4x3
            config = self.load_config()
            if config and 'rows' in config and 'cols' in config:
                rows = config['rows']
                cols = config['cols']
                print(f"Using config dimensions: {rows}x{cols}", file=sys.stderr)
                
                # Validate that we don't have more board lines than expected
                if len(board_lines) > rows:
                    print(f"WARNING: Board has {len(board_lines)} lines but config specifies {rows} rows. Truncating to match config.", file=sys.stderr)
                    board_lines = board_lines[:rows]
                elif len(board_lines) < rows:
                    print(f"WARNING: Board has {len(board_lines)} lines but config specifies {rows} rows. Padding with empty rows.", file=sys.stderr)
                    while len(board_lines) < rows:
                        board_lines.append('⚫ ' * cols)
            else:
                # Fallback to parsing dimensions (original behavior)
                rows = len(board_lines)
                cols = len(board_lines[0].split())
                print(f"WARNING: Config not available, using parsed dimensions: {rows}x{cols}", file=sys.stderr)
            
            # Create game instance
            game = ChainReactionGame(rows, cols)
            # Set interactive mode for explosion delays
            game.interactive_mode = True
            
            # Parse each cell (only up to the expected dimensions)
            for r in range(min(len(board_lines), rows)):
                line = board_lines[r]
                cells = line.split()
                for c in range(min(len(cells), cols)):
                    cell_str = cells[c]
                    if cell_str == '⚫':
                        game.board[r][c].orbs = 0
                        game.board[r][c].player = Player.EMPTY
                    elif cell_str.startswith('🔴'):
                        orbs = int(cell_str[1:]) if len(cell_str) > 1 else 1
                        game.board[r][c].orbs = orbs
                        game.board[r][c].player = Player.RED
                    elif cell_str.startswith('🔵'):
                        orbs = int(cell_str[1:]) if len(cell_str) > 1 else 1
                        game.board[r][c].orbs = orbs
                        game.board[r][c].player = Player.BLUE
            
            # Set move count and other game state
            for line in lines:
                if line.startswith('MoveCount:'):
                    # Use total orbs count as move count (this represents current game progress)
                    game.move_count = int(line.split(': ')[1])
                elif line.startswith('LastPlayer:'):
                    last_player = line.split(': ')[1].strip()
                    if last_player == 'RED':
                        game.current_player = Player.BLUE
                    elif last_player == 'BLUE':
                        game.current_player = Player.RED
                    else:  # EMPTY or first move
                        game.current_player = Player.RED  # Default to RED for first move
            
            print(f"Parsed game state: move_count={game.move_count}, current_player={game.current_player.value}", file=sys.stderr)
            return game
            
        except Exception as e:
            print(f"Error parsing game state: {e}", file=sys.stderr)
            return None
    
    def save_game_state(self):
        """Save current game state to file using the game engine's built-in method"""
        try:
            if self.game is None:
                return False
            
            # Use the game engine's built-in save method
            self.game.save_to_file(self.game_state_file, "Move Processed")
            
            # Get total orbs for debugging
            scores = self.game.get_score()
            total_orbs = scores[Player.RED] + scores[Player.BLUE]
            
            print(f"Game state saved: Total orbs: {total_orbs}, GameOver: {self.game.game_over}", file=sys.stderr)
            return True
            
        except Exception as e:
            print(f"Error saving game state: {e}", file=sys.stderr)
            return False
    
    def process_ai_move(self):
        """Process an AI move request from the frontend"""
        try:
            # Read the game state file
            if not os.path.exists(self.game_state_file):
                print("Game state file not found", file=sys.stderr)
                return False
            
            with open(self.game_state_file, 'r') as f:
                content = f.read()
            
            # Check for AI move request
            if "AI_MOVE_REQUEST:" not in content:
                print("No AI move request found", file=sys.stderr)
                return False
            
            # Load or create game instance from current state
            if self.game is None:
                # Try to use the game engine's load method first
                try:
                    # Write the content to a temporary format that the game engine can read
                    temp_content = self.convert_to_game_engine_format(content)
                    temp_file = self.game_state_file + '.temp'
                    with open(temp_file, 'w') as f:
                        f.write(temp_content)
                    self.game = ChainReactionGame.load_from_file(temp_file)
                    # Clean up temporary file
                    try:
                        os.remove(temp_file)
                    except:
                        pass
                except Exception as e:
                    print(f"Failed to load using game engine method: {e}", file=sys.stderr)
                    # Fallback to manual parsing
                    self.game = self.parse_game_state_from_file(content)
            
            if self.game is None:
                print("Failed to load game state for AI move", file=sys.stderr)
                return False
            
            # Get configuration
            config = self.load_config()
            if not config:
                print("Failed to load configuration for AI move", file=sys.stderr)
                return False
                
            current_player = self.game.current_player
            print(f"AI move: current player is {current_player.value}", file=sys.stderr)
            
            # Create appropriate AI based on configuration format
            ai_player = current_player  # Use the actual current player from game state
            
            # Handle AI vs AI mode with individual AI configurations
            if config.get('mode') == 'AI vs AI' and 'redAI' in config and 'blueAI' in config:
                # Use specific AI configuration based on current player
                if current_player.value == 'Red':
                    ai_config = config['redAI']
                else:
                    ai_config = config['blueAI']
                
                if ai_config.get('type') == 'Random':
                    print(f"Using {current_player.value} AI config: Random AI (no difficulty or heuristic needed)", file=sys.stderr)
                    ai = RandomAI(ai_player)
                    print(f"Created Random AI for {ai_player.value}", file=sys.stderr)
                else:
                    print(f"Using {current_player.value} AI config: {ai_config}", file=sys.stderr)
                    depth = self.get_difficulty_depth(ai_config.get('difficulty', 'Medium'))
                    heuristic_func = self.get_heuristic_function(ai_config.get('heuristic', 'combined_v2'))
                    ai = MinimaxAI(ai_player, depth, heuristic_func=heuristic_func)
                    print(f"Created Minimax AI for {ai_player.value} with depth {depth} and heuristic {ai_config.get('heuristic')}", file=sys.stderr)
            else:
                # Handle legacy single AI configuration
                if config.get('aiType') == 'Random':
                    print(f"Using legacy Random AI config (no difficulty or heuristic needed)", file=sys.stderr)
                    ai = RandomAI(ai_player)
                    print(f"Created Random AI for {ai_player.value}", file=sys.stderr)
                else:
                    depth = self.get_difficulty_depth(config.get('difficulty', 'Medium'))
                    heuristic_func = self.get_heuristic_function(config.get('heuristic', 'combined_v2'))
                    ai = MinimaxAI(ai_player, depth, heuristic_func=heuristic_func)
                    print(f"Created Minimax AI for {ai_player.value} with depth {depth}", file=sys.stderr)
            
            # Get AI move
            print(f"Getting AI move for {ai_player.value}...", file=sys.stderr)
            move = ai.get_best_move(self.game)
            if move:
                row, col = move
                print(f"AI chose move: ({row}, {col})", file=sys.stderr)
                success = self.game.make_move(row, col, current_player)
                
                if success:
                    # Save updated game state
                    move_type = f"{config.get('aiType', 'Smart')} AI Move"
                    self.game.save_to_file(self.game_state_file, move_type)
                    print(f"AI move successful: {ai_player.value} at ({row}, {col})", file=sys.stderr)
                    return True
                else:
                    print(f"AI move failed: {ai_player.value} at ({row}, {col})", file=sys.stderr)
                    return False
            else:
                print("AI could not find a valid move", file=sys.stderr)
                return False
                
        except Exception as e:
            print(f"Error processing AI move: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

def main():
    """Main entry point - check for bridge mode"""
    if len(sys.argv) > 1 and sys.argv[1] == '--bridge-mode':
        # Run in bridge mode
        controller = BridgeGameController()
        controller.run_bridge_mode()
    else:
        # Run normal game mode
        controller = GameController()
        controller.play_game()

if __name__ == "__main__":
    main()
