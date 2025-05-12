import csv

def convert_to_csv():
    known_best = {
        'G1': 12078, 'G2': 12084, 'G3': 12077, 'G11': 627, 'G12': 621,
        'G13': 645, 'G14': 3187, 'G15': 3169, 'G16': 3172, 'G22': 14123,
        'G23': 14129, 'G24': 14131, 'G32': 1560, 'G33': 1537, 'G34': 1541,
        'G35': 8000, 'G36': 7996, 'G37': 8009, 'G43': 7027, 'G44': 7022,
        'G45': 7020, 'G48': 6000, 'G49': 6000, 'G50': 5988
    }

    with open('results.txt', 'r') as infile, open('2105015.csv', 'w', newline='') as outfile:
        reader = csv.reader(infile, delimiter='|')
        writer = csv.writer(outfile)
        
        # Write simplified header
        writer.writerow([
            'Problem', '|V|', '|E|',
            'Randomized', 'Greedy',
            'Semi-greedy Weight',
            'Simple Local Iterations', 'Local Search Average value',
            'GRASP Iterations', 'GRASP Best',
            'Known Best'
        ])
        
        next(reader)  # Skip input header
        
        for row in reader:
            cleaned = [x.strip() for x in row]
            name = cleaned[0]
            
            writer.writerow([
                name,                    # Problem
                cleaned[1],              # |V|
                cleaned[2],              # |E|
                cleaned[3],              # Randomized
                cleaned[4],              # Greedy
                cleaned[6],              # Semi-greedy Weight
                20,                      # Simple Local Search iterations
                cleaned[8],              # Local Search Avg Value
                50,                      # GRASP Iterations (fixed)
                cleaned[9],              # GRASP Best
                known_best.get(name, '') # Known Best
            ])

if __name__ == "__main__":
    convert_to_csv()
    print("CSV file generated successfully as 2105015.csv")