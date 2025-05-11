# # import pandas as pd
# # import matplotlib.pyplot as plt

# # df = pd.read_csv("2105015.csv")
# # # Filter problems with known best solutions
# # known_best_df = df[df['Known Best'].notna()]

# # plt.figure(figsize=(15, 7))
# # problems = known_best_df['Problem']
# # plt.plot(problems, known_best_df['Greedy'], label='Greedy', marker='o')
# # plt.plot(problems, known_best_df['Semi-greedy Weight'], label='Semi-Greedy (α=0.85)', marker='x')
# # plt.plot(problems, known_best_df['Local Search Average value'], label='Local Search (Avg)', marker='^')
# # plt.plot(problems, known_best_df['GRASP Best'], label='GRASP (50 Iter)', marker='s')
# # plt.plot(problems, known_best_df['Known Best'], label='Known Best', linestyle='--', marker='*')

# # plt.xlabel('Benchmark Problem')
# # plt.ylabel('Cut Weight')
# # plt.title('Heuristic Performance vs. Known Optimal Values')
# # plt.xticks(rotation=45)
# # plt.legend()
# # plt.grid(True)
# # plt.tight_layout()
# # plt.savefig('performance_plot.png', dpi=300)

# import pandas as pd
# import matplotlib.pyplot as plt

# # Load CSV data
# df = pd.read_csv("2105015.csv")

# # Filter rows where 'Known Best' is not empty
# known_best_df = df[df['Known Best'].notna()]

# # User-specified problems to include
# sample_problems = ["G1", "G2", "G6", "G10", "G11", "G14", "G22", "G27", 
#                    "G32", "G35", "G43", "G48", "G50", "G54"]
# filtered_df = known_best_df[known_best_df['Problem'].isin(sample_problems)]

# # Plot settings
# plt.figure(figsize=(18, 8))
# x = range(len(filtered_df))
# width = 0.12  # Adjusted for 14 problems

# # Plot bars for each heuristic
# plt.bar(x, filtered_df['Randomized'], width, label='Randomized', color='#1f77b4')
# plt.bar([i + width for i in x], filtered_df['Greedy'], width, label='Greedy', color='#ff7f0e')
# plt.bar([i + 2*width for i in x], filtered_df['Semi-greedy Weight'], width, label='Semi-Greedy', color='#2ca02c')
# plt.bar([i + 3*width for i in x], filtered_df['Local Search Average value'], width, label='Local Search', color='#d62728')
# plt.bar([i + 4*width for i in x], filtered_df['GRASP Best'], width, label='GRASP', color='#9467bd')
# plt.plot(x, filtered_df['Known Best'], 'k*', markersize=12, label='Known Best')

# # Labels and styling
# plt.xlabel('Benchmark Problem', fontsize=12)
# plt.ylabel('Cut Weight', fontsize=12)
# plt.title('Heuristic Performance vs. Known Optimal Values', fontsize=14)
# plt.xticks([i + 2*width for i in x], filtered_df['Problem'], rotation=45, ha='right', fontsize=10)
# plt.legend(loc='upper left', bbox_to_anchor=(1, 1))  # Move legend outside
# plt.grid(axis='y', linestyle='--', alpha=0.7)
# plt.tight_layout()

# # Save the plot
# plt.savefig('performance_plot.png', dpi=300, bbox_inches='tight')

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Load the CSV
df = pd.read_csv('2105015.csv')

# Sample 15 test cases uniformly from rows 0 to 53 (i.e., first 54 problems)
uniform_indices = np.linspace(0, 53, 15, dtype=int)
sel = df.iloc[uniform_indices]

# Extract data
problems = sel['Problem']
randomized = sel['Randomized']
greedy = sel['Greedy']
semi = sel['Semi-greedy Weight']
grasp = sel['GRASP Best']

# X-axis setup
x = np.arange(len(problems))
width = 0.2

# Plotting
plt.figure(figsize=(14, 6))
plt.bar(x - 1.5*width, randomized, width, label='Randomized')
plt.bar(x - 0.5*width, greedy, width, label='Greedy')
plt.bar(x + 0.5*width, semi, width, label='Semi-greedy Weight')
plt.bar(x + 1.5*width, grasp, width, label='GRASP')

plt.xticks(x, problems, rotation=45, ha='right')
plt.ylabel('Cut Weight')
plt.title('Comparison of Heuristics on 15 Test Cases')
plt.legend()
plt.tight_layout()
plt.savefig('chart.png')
plt.close()


