#include <random>
#include <climits>
#include <unordered_set>
#include"optimGraph.hpp"

Cut generateRandomCut(const Graph& g) {
    Cut cut(g.n);
    static std::random_device rd;
    static std::default_random_engine generator(rd());
    std::uniform_int_distribution<int> dist(0, 1);

    for (int i = 0; i < g.n; ++i) {
        if (dist(generator) == 0) cut.addToX(i);
        else cut.addToY(i);
    }
    return cut;
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

int gainToSide(const Graph& g, int node, const std::vector<bool>& oppositePartition) {
    int gain = 0;
    for (const auto& [v, w] : g.adj[node]) {
        if (oppositePartition[v]) gain += w;  // O(1) lookup
    }
    return gain;
}

Cut greedyCut(const Graph& g) {
    Cut cut(g.n);
    std::unordered_set<int> remaining;
    for (int i = 0; i < g.n; ++i) remaining.insert(i);

    // Start with the heaviest edge
    Edge maxEdge = g.getHeaviestEdge();
    cut.addToX(maxEdge.u);
    cut.addToY(maxEdge.v);
    remaining.erase(maxEdge.u);
    remaining.erase(maxEdge.v);

    while (!remaining.empty()) {
        int bestNode = -1;
        bool assignToX = true;
        int bestGain = INT_MIN;

        for (int u : remaining) {
            int gainX = gainToSide(g, u, cut.inY);  // Gain if added to X
            int gainY = gainToSide(g, u, cut.inX);  // Gain if added to Y

            if (gainX >= gainY && gainX > bestGain) {
                bestGain = gainX;
                bestNode = u;
                assignToX = true;
            } else if (gainY > gainX && gainY > bestGain) {
                bestGain = gainY;
                bestNode = u;
                assignToX = false;
            }
        }

        if (assignToX) cut.addToX(bestNode);
        else cut.addToY(bestNode);
        remaining.erase(bestNode);
    }
    return cut;
}

// Helper function to select from RCL 
std::tuple<int, int, bool> selectFromRCL(
    const std::vector<std::tuple<int, int, bool>>& candidates, 
    int worstGain, 
    int bestGain, 
    double alpha) {

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

Cut semiGreedyCut(const Graph& g, double alpha) {
    Cut cut(g.n);
    std::unordered_set<int> remaining;
    for (int i = 0; i < g.n; ++i) remaining.insert(i);

    Edge maxEdge = g.getHeaviestEdge();
    cut.addToX(maxEdge.u);
    cut.addToY(maxEdge.v);
    remaining.erase(maxEdge.u);
    remaining.erase(maxEdge.v);

    while (!remaining.empty()) {
        std::vector<std::tuple<int, int, bool>> candidates;
        int bestGain = INT_MIN, worstGain = INT_MAX;

        for (int u : remaining) {
            
            int gainX = gainToSide(g, u, cut.inY);
            int gainY = gainToSide(g, u, cut.inX);
            int maxGain = std::max(gainX, gainY);
            bool toX = (gainX >= gainY);
            candidates.emplace_back(maxGain, u, toX);
            bestGain = std::max(bestGain, maxGain);
            worstGain = std::min(worstGain, std::min(gainX, gainY));
        }

        auto [gain, node, assignToX] = selectFromRCL(candidates, worstGain, bestGain, alpha);
        if (assignToX) cut.addToX(node);
        else cut.addToY(node);
        remaining.erase(node);
    }
    return cut;
}

Cut localSearch(const Graph& g, Cut cut, int& iterationCount) {
    std::vector<int> sum_in(g.n, 0), sum_out(g.n, 0);
    
    // Initialize sum_in/sum_out in O(m) time
    for (int v = 0; v < g.n; ++v) {
        for (const auto& [u, w] : g.adj[v]) {
            if ((cut.inX[v] && cut.inX[u]) || (cut.inY[v] && cut.inY[u])) {
                sum_in[v] += w;
            } else {
                sum_out[v] += w;
            }
        }
    }

    bool improved = true;
    iterationCount = 0;
    std::vector<int> vertices(g.n);
    std::iota(vertices.begin(), vertices.end(), 0);
    
    while (improved) {
        improved = false;
        iterationCount++;
        
        // Shuffle once per iteration for randomness
        std::shuffle(vertices.begin(), vertices.end(), std::default_random_engine(std::random_device{}()));
        
        // First-improvement strategy
        for (int v : vertices) {
            const int delta = sum_in[v] - sum_out[v];
            if (delta <= 0) continue;

            // Cache current partition
            const bool was_inX = cut.inX[v];
            
            // Flip the vertex
            was_inX ? cut.addToY(v) : cut.addToX(v);
            
            // Update neighbor sums in O(d) time
            for (const auto& [u, w] : g.adj[v]) {
                if (was_inX) {
                    if (cut.inX[u]) {  // u was same partition
                        sum_out[u] += w;
                        sum_in[u] -= w;
                    } else {  // u was opposite partition
                        sum_in[u] += w;
                        sum_out[u] -= w;
                    }
                } else {
                    if (cut.inY[u]) {  // u was same partition
                        sum_out[u] += w;
                        sum_in[u] -= w;
                    } else {  // u was opposite partition
                        sum_in[u] += w;
                        sum_out[u] -= w;
                    }
                }
            }
            
            // Update flipped vertex's sums
            sum_in[v] = sum_out[v] = 0;
            for (const auto& [u, w] : g.adj[v]) {
                if ((cut.inX[v] && cut.inX[u]) || (cut.inY[v] && cut.inY[u])) {
                    sum_in[v] += w;
                } else {
                    sum_out[v] += w;
                }
            }

            improved = true;
            break;  // Restart iteration after first improvement
        }
    }
    return cut;
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

Cut grasp(const Graph& g, double alpha, int maxIterations) {
    Cut bestCut(g.n); 
    int bestWeight = -1;
    
    for (int i = 0; i < maxIterations; i++) {
        Cut currentCut = semiGreedyCut(g, alpha);
        
        int iterations;
        currentCut = localSearch(g, currentCut, iterations);
        
        // Check if this is the best solution so far
        int currentWeight = currentCut.computeWeight(g);
        if (currentWeight > bestWeight) {
            bestWeight = currentWeight;
            bestCut = currentCut; 
        }
    }
    return bestCut;
}