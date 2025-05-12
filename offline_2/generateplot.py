# import pandas as pd
# import matplotlib.pyplot as plt
# import numpy as np

# # Load the CSV
# df = pd.read_csv('2105015.csv')
# print(df.columns)

# # Sample 15 test cases uniformly from rows 0 to 53 (i.e., first 54 problems)
# uniform_indices = np.linspace(0, 53, 15, dtype=int)
# sel = df.iloc[uniform_indices]

# # Extract data
# problems = sel['Problem']
# randomized = sel['Randomized']
# greedy = sel['Greedy']
# semi = sel['Semi-greedy Weight']
# grasp = sel['GRASP Best']

# # X-axis setup
# x = np.arange(len(problems))
# width = 0.2

# # Plotting
# plt.figure(figsize=(14, 6))
# plt.bar(x - 1.5*width, randomized, width, label='Randomized')
# plt.bar(x - 0.5*width, greedy, width, label='Greedy')
# plt.bar(x + 0.5*width, semi, width, label='Semi-greedy Weight')
# plt.bar(x + 1.5*width, grasp, width, label='GRASP')

# plt.xticks(x, problems, rotation=45, ha='right')
# plt.ylabel('Cut Weight')
# plt.title('Comparison of Heuristics on 15 Test Cases')
# plt.legend()
# plt.tight_layout()
# plt.savefig('chart.png')
# plt.close()

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Load the CSV
df = pd.read_csv("2105015.csv")

# Select 15 uniformly from rows 0–26 (problems 1–27)
indices_first = np.linspace(0, 26, 15, dtype=int)

# Select 15 uniformly from rows 27–53 (problems 28–54)
indices_second = np.linspace(27, 53, 15, dtype=int)

# Extract subsets
first_half = df.iloc[indices_first]
second_half = df.iloc[indices_second]

# Plotting function
def plot_bar_chart(data, filename, title):
    problems = data['Problem']
    x = np.arange(len(problems))
    width = 0.15

    # Extract heuristic values
    randomized = data['Randomized']
    greedy = data['Greedy']
    semi = data['Semi-greedy Weight']
    local = data['Local Search Average value']
    grasp = data['GRASP Best']

    plt.figure(figsize=(14, 6))
    plt.bar(x - 2*width, randomized, width, label='Randomized')
    plt.bar(x - width, greedy, width, label='Greedy')
    plt.bar(x, semi, width, label='Semi-greedy')
    plt.bar(x + width, local, width, label='Local Search')
    plt.bar(x + 2*width, grasp, width, label='GRASP')

    plt.xticks(x, problems, rotation=45, ha='right')
    plt.ylabel('Cut Weight')
    plt.title(title)
    plt.legend()
    plt.tight_layout()
    plt.savefig(filename)
    plt.close()

# Generate the two charts
plot_bar_chart(first_half, 'chart1.png', 'Heuristic Comparison (Problems 1–27, Sampled 15)')
plot_bar_chart(second_half, 'chart2.png', 'Heuristic Comparison (Problems 28–54, Sampled 15)')

