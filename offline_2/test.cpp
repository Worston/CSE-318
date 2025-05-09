#include <bits/stdc++.h>
#include "Graph.hpp"
using namespace std;

// Function to generate a random cut without explicitly passing mt19937
Cut generateRandomCut(const Graph& g) {
    std::set<int> X, Y;
    // Use random_device as a seed for better randomness
    static std::random_device rd;
    static std::default_random_engine generator(rd());
    std::uniform_int_distribution<int> dist(0, 1);
    
    for (int i = 0; i < g.n; ++i) {
        if (dist(generator) == 0) X.insert(i);
        else Y.insert(i);
    }
    return Cut(X, Y);
}

// Compute average weight of random cuts
double averageRandomCutWeight(const Graph& g, int iterations = 5) {
    int total = 0;
    for (int i = 0; i < iterations; ++i) {
        Cut cut = generateRandomCut(g);
        total += cut.computeWeight(g);
    }
    return total / static_cast<double>(iterations);
}

// Calculate gain of adding a node to a specific side
int gainToSide(const Graph& g, int node, const std::set<int>& opposite) {
    int gain = 0;
    for (auto [v, w] : g.adj[node]) {
        if (opposite.count(v)) gain += w;
    }
    return gain;
}

// Greedy algorithm for MAX-CUT
Cut greedyCut(const Graph& g) {
    std::set<int> X, Y;
    std::vector<int> remaining;
    for (int i = 0; i < g.n; ++i) remaining.push_back(i);

    // Start with the heaviest edge
    Edge maxEdge = g.getHeaviestEdge();
    X.insert(maxEdge.u);
    Y.insert(maxEdge.v);
    
    // Remove the initial vertices from the remaining set
    remaining.erase(std::remove(remaining.begin(), remaining.end(), maxEdge.u), remaining.end());
    remaining.erase(std::remove(remaining.begin(), remaining.end(), maxEdge.v), remaining.end());

    // Greedy assignment of remaining vertices
    while (!remaining.empty()) {
        int bestGain = INT_MIN;
        int bestNode = -1;
        bool assignToX = true;

        for (int u : remaining) {
            int gainX = gainToSide(g, u, Y);  // Gain if u is added to X
            int gainY = gainToSide(g, u, X);  // Gain if u is added to Y

            if (gainX > gainY && gainX > bestGain) {
                bestGain = gainX;
                bestNode = u;
                assignToX = true;
            } else if (gainY > gainX && gainY > bestGain) {
                bestGain = gainY;
                bestNode = u;
                assignToX = false;
            } else if (gainX == gainY && gainX > bestGain) {
                // In case of tie, randomly choose side
                bestGain = gainX;
                bestNode = u;
                static std::random_device rd;
                static std::default_random_engine g(rd());
                std::uniform_int_distribution<int> d(0, 1);
                assignToX = d(g) == 0;
            }
        }

        if (assignToX) X.insert(bestNode);
        else Y.insert(bestNode);

        remaining.erase(std::remove(remaining.begin(), remaining.end(), bestNode), remaining.end());
    }

    return Cut(X, Y);
}

// Helper function to select from RCL without explicitly passing mt19937
std::tuple<int, int, bool> selectFromRCL(
    const std::vector<std::tuple<int, int, bool>>& candidates, 
    int worstGain, 
    int bestGain, 
    double alpha) 
{
    int threshold = worstGain + static_cast<int>(alpha * (bestGain - worstGain));
    std::vector<std::tuple<int, int, bool>> RCL;
    
    // Build RCL with candidates above threshold
    for (const auto& tup : candidates) {
        if (std::get<0>(tup) >= threshold)
            RCL.push_back(tup);
    }

    // Fallback if RCL is empty
    if (RCL.empty()) {
        if (candidates.empty()) throw std::runtime_error("No candidates to select from.");
        RCL = candidates;
    }

    // Random selection from RCL
    static std::random_device rd;
    static std::default_random_engine generator(rd());
    std::uniform_int_distribution<int> dist(0, static_cast<int>(RCL.size()) - 1);
    return RCL[dist(generator)];
}

// Semi-greedy algorithm for MAX-CUT
Cut semiGreedyCut(const Graph& g, double alpha) {
    std::set<int> X, Y;
    std::vector<int> remaining;
    for (int i = 0; i < g.n; ++i) remaining.push_back(i);

    // Start with the heaviest edge
    Edge maxEdge = g.getHeaviestEdge();
    X.insert(maxEdge.u);
    Y.insert(maxEdge.v);
    
    // Remove the initial vertices from the remaining set
    remaining.erase(std::remove(remaining.begin(), remaining.end(), maxEdge.u), remaining.end());
    remaining.erase(std::remove(remaining.begin(), remaining.end(), maxEdge.v), remaining.end());

    // Semi-greedy assignment of remaining vertices
    while (!remaining.empty()) {
        std::vector<std::tuple<int, int, bool>> candidates;
        int bestGain = INT_MIN;
        int worstGain = INT_MAX;

        // Calculate gains for all remaining vertices
        for (int u : remaining) {
            int gainX = gainToSide(g, u, Y);
            int gainY = gainToSide(g, u, X);
            int maxGain = std::max(gainX, gainY);
            int minGain = std::min(gainX, gainY);
            bool toX = (gainX >= gainY);

            bestGain = std::max(bestGain, maxGain);
            worstGain = std::min(worstGain, minGain);
            candidates.emplace_back(maxGain, u, toX);
        }

        // Select candidate from RCL
        auto [gain, node, assignToX] = selectFromRCL(candidates, worstGain, bestGain, alpha);
        
        // Assign selected node to partition
        if (assignToX) X.insert(node);
        else Y.insert(node);

        // Remove assigned node from remaining set
        remaining.erase(std::remove(remaining.begin(), remaining.end(), node), remaining.end());
    }

    return Cut(X, Y);
}

// Corrected Local Search implementation
Cut localSearch(const Graph& g, Cut cut, int& iterationCount) {
    bool improved = true;
    iterationCount = 0;
    int currentWeight = cut.computeWeight(g);
    
    while (improved) {
        improved = false;
        iterationCount++;
        
        // Randomize vertex order for better escape from local optima
        std::vector<int> vertices;
        for (int i = 0; i < g.n; i++) {
            vertices.push_back(i);
        }
        
        // Shuffle vertices to add randomness to search
        static std::random_device rd;
        static std::default_random_engine rng(rd());
        std::shuffle(vertices.begin(), vertices.end(), rng);
        
        // Consider each vertex for potential move
        for (int v : vertices) {
            // Determine which partition v is currently in
            bool inX = cut.X.count(v) > 0;
            const std::set<int>& currentSet = inX ? cut.X : cut.Y;
            const std::set<int>& oppositeSet = inX ? cut.Y : cut.X;
            
            // Calculate the change in cut weight if v moves from current set to opposite set
            int delta = 0;
            
            // For each edge connected to v
            for (const auto& [neighbor, weight] : g.adj[v]) {
                if (currentSet.count(neighbor) > 0) {
                    // This edge is currently WITHIN a partition - moving v would make it BETWEEN partitions
                    delta += weight;  // Gain
                } else if (oppositeSet.count(neighbor) > 0) {
                    // This edge is currently BETWEEN partitions - moving v would make it WITHIN a partition
                    delta -= weight;  // Loss
                }
            }
            
            // If moving the vertex improves the cut
            if (delta > 0) {
                // Perform the move
                if (inX) {
                    cut.X.erase(v);
                    cut.Y.insert(v);
                } else {
                    cut.Y.erase(v);
                    cut.X.insert(v);
                }
                
                // Update current weight
                currentWeight += delta;
                improved = true;
                break; // First improvement strategy
            }
        }
    }
    
    // Verify final weight for sanity check
    int verifiedWeight = cut.computeWeight(g);
    if (currentWeight != verifiedWeight) {
        std::cerr << "Warning: Weight tracking error. Tracked: " << currentWeight 
                  << ", Actual: " << verifiedWeight << std::endl;
    }
    
    return cut;
}

// GRASP implementation for MAX-CUT
Cut grasp(const Graph& g, double alpha, int maxIterations) {
    Cut bestCut;
    int bestWeight = -1;
    
    for (int i = 0; i < maxIterations; i++) {
        // Construction phase
        Cut currentCut = semiGreedyCut(g, alpha);
        
        // Local Search phase
        int iterations;
        currentCut = localSearch(g, currentCut, iterations);
        
        int weight = currentCut.computeWeight(g);
        if (weight > bestWeight) {
            bestWeight = weight;
            bestCut = currentCut;
        }
    }
    return bestCut;
}

// Function to measure average performance of local search from random starts
double averageLocalSearchFromRandom(const Graph& g, int trials, double& avgIterations) {
    int totalWeight = 0;
    int totalIterations = 0;

    for (int i = 0; i < trials; ++i) {
        int iterationCount = 0;
        Cut init = generateRandomCut(g);
        Cut optimized = localSearch(g, init, iterationCount);
        totalWeight += optimized.computeWeight(g);
        totalIterations += iterationCount;
    }

    avgIterations = totalIterations / static_cast<double>(trials);
    return totalWeight / static_cast<double>(trials);
}

// Expanded main function to run experiments across different algorithms
int main() {
    // Load graph
    Graph g = Graph::loadFromFile("testcases/g1.rud");
    if (g.n == 0) {
        std::cerr << "Error: Empty graph loaded.\n";
        return 1;
    }

    // Generate a random alpha value for semi-greedy algorithm
    static std::random_device rd;
    static std::default_random_engine rng(rd());
    std::uniform_real_distribution<double> alphaGen(0.0, 1.0);
    double alpha = alphaGen(rng);

    using clock = std::chrono::high_resolution_clock;
    auto start = clock::now();
    auto end = clock::now();

    // Random Cut
    std::cout << "\n===== Random Cut =====\n";
    start = clock::now();
    Cut randCut = generateRandomCut(g);
    int randWeight = randCut.computeWeight(g);
    end = clock::now();
    std::cout << "Weight: " << randWeight << "\n";
    std::cout << "Time: " << std::chrono::duration<double>(end - start).count() << "s\n";

    // Average of Random Cuts
    std::cout << "\n===== Average of 10 Random Cuts =====\n";
    start = clock::now();
    double avgRandom = averageRandomCutWeight(g, 10);
    end = clock::now();
    std::cout << "Average Weight: " << avgRandom << "\n";
    std::cout << "Time: " << std::chrono::duration<double>(end - start).count() << "s\n";

    // Greedy Cut
    std::cout << "\n===== Greedy Cut =====\n";
    start = clock::now();
    Cut greedy = greedyCut(g);
    int greedyWeight = greedy.computeWeight(g);
    end = clock::now();
    std::cout << "Weight: " << greedyWeight << "\n";
    std::cout << "Time: " << std::chrono::duration<double>(end - start).count() << "s\n";

    // Semi-Greedy 
    std::cout << "\n===== Semi-Greedy Cut =====\n";
    start = clock::now();
    Cut semi = semiGreedyCut(g, alpha);
    int semiWeight = semi.computeWeight(g);
    end = clock::now();
    std::cout << "Alpha: " << alpha << "\n";
    std::cout << "Weight: " << semiWeight << "\n";
    std::cout << "Time: " << std::chrono::duration<double>(end - start).count() << "s\n";

    // Local Search from Random
    std::cout << "\n===== Local Search from Random =====\n";
    start = clock::now();
    double avgIter = 0.0;
    double avgLSWeight = averageLocalSearchFromRandom(g, 5, avgIter);
    end = clock::now();
    std::cout << "Average Weight: " << avgLSWeight << "\n";
    std::cout << "Average Iterations: " << avgIter << "\n";
    std::cout << "Time: " << std::chrono::duration<double>(end - start).count() << "s\n";

    // GRASP
    std::cout << "\n===== GRASP (50 iterations) =====\n";
    start = clock::now();
    Cut graspCut = grasp(g, alpha, 50);
    int graspWeight = graspCut.computeWeight(g);
    end = clock::now();
    std::cout << "Weight: " << graspWeight << "\n";
    std::cout << "Time: " << std::chrono::duration<double>(end - start).count() << "s\n";

    // Print summary of results
    std::cout << "\n===== Summary =====\n";
    std::cout << "Random Cut: " << randWeight << "\n";
    std::cout << "Greedy Cut: " << greedyWeight << "\n";
    std::cout << "Semi-Greedy Cut (alpha=" << alpha << "): " << semiWeight << "\n";
    std::cout << "Average Local Search from Random: " << avgLSWeight << "\n";
    std::cout << "GRASP: " << graspWeight << "\n";

    return 0;
}