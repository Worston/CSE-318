#include <bits/stdc++.h>
#include "Algorithms.hpp"
using namespace std;

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
    double alpha = /*alphaGen(rng)*/ 0.85;

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
    std::cout << "Average Weight: " << (int)avgRandom << "\n";
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
    std::cout << "Average Weight: " << (int)avgLSWeight << "\n";
    std::cout << "Average Iterations: " << (int)avgIter << "\n";
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