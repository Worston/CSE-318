#include <random>
#include <climits>
#include <unordered_set>
#include <queue>
#include <tuple>
#include"optimGraph.hpp"

// n -> no. of vertices , m -> no. of edges 
// O(n) 
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
// O(iterations × (n + m))
double averageRandomCutWeight(const Graph& g, int iterations = 5) {
    int total = 0;
    for (int i = 0; i < iterations; ++i) {
        Cut cut = generateRandomCut(g);
        total += cut.computeWeight(g);
    }
    return total / static_cast<double>(iterations);
}

// O(degree(node)) 
int gainToSide(const Graph& g, int node, const std::vector<bool>& oppositePartition) {
    int gain = 0;
    for (const auto& [v, w] : g.adj[node]) {
        if (oppositePartition[v]) gain += w;  // O(1) lookup
    }
    return gain;
}

// O(n)
Cut greedyCut(const Graph& g) {
    Cut cut(g.n);
    std::vector<bool> assigned(g.n, false);
    
    // Start with the heaviest edge
    Edge maxEdge = g.getHeaviestEdge();
    cut.addToX(maxEdge.u);
    cut.addToY(maxEdge.v);
    assigned[maxEdge.u] = assigned[maxEdge.v] = true;
    
    // Process each remaining vertex once
    for (int u = 0; u < g.n; ++u) {
        if (assigned[u]) continue;  // Skip already assigned vertices
        
        // Calculate gain for each side
        int gainX = gainToSide(g, u, cut.inY);  // Gain if added to X
        int gainY = gainToSide(g, u, cut.inX);  // Gain if added to Y
        
        // Place vertex in the partition with higher gain
        if (gainX >= gainY) {
            cut.addToX(u);
        } else {
            cut.addToY(u);
        }
        assigned[u] = true;
    }
    return cut;
}

// O(mlogn)
Cut improvedgreedyCut(const Graph& g) {
    Cut cut(g.n);
    std::vector<bool> assigned(g.n, false);
    
    // Use a max-heap that stores both gains to avoid recomputation
    using NodeEntry = std::tuple<int, int, int, int>; // (max_gain, gainX, gainY, node)
    std::priority_queue<NodeEntry> gain_queue;

    // Start with heaviest edge
    Edge max_edge = g.getHeaviestEdge();
    cut.addToX(max_edge.u);
    cut.addToY(max_edge.v);
    assigned[max_edge.u] = assigned[max_edge.v] = true;

    // Initialize queue with precomputed gains
    for (int u = 0; u < g.n; ++u) {
        if (assigned[u]) continue;
        
        int gainX = gainToSide(g, u, cut.inY);
        int gainY = gainToSide(g, u, cut.inX);
        gain_queue.emplace(std::max(gainX, gainY), gainX, gainY, u);
    }

    while (!gain_queue.empty()) {
        auto [_, gainX, gainY, u] = gain_queue.top();
        gain_queue.pop();
        
        if (assigned[u]) continue;
        
        // Use precomputed gains from queue
        if (gainX >= gainY) {
            cut.addToX(u);
            // Update neighbors' gains for Y partition
            for (auto [v, w] : g.adj[u]) {
                if (!assigned[v]) {
                    int newGainY = gainToSide(g, v, cut.inX);
                    int newGainX = gainToSide(g, v, cut.inY);
                    gain_queue.emplace(std::max(newGainX, newGainY), newGainX, newGainY, v);
                }
            }
        } else {
            cut.addToY(u);
            // Update neighbors' gains for X partition
            for (auto [v, w] : g.adj[u]) {
                if (!assigned[v]) {
                    int newGainX = gainToSide(g, v, cut.inY);
                    int newGainY = gainToSide(g, v, cut.inX);
                    gain_queue.emplace(std::max(newGainX, newGainY), newGainX, newGainY, v);
                }
            }
        }
        assigned[u] = true;
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

// O(n²+m) 
Cut semiGreedyCut(const Graph& g, double alpha) {
    Cut cut(g.n);
    std::unordered_set<int> remaining;
    for (int i = 0; i < g.n; ++i) remaining.insert(i);

    Edge maxEdge = g.getHeaviestEdge();
    cut.addToX(maxEdge.u);
    cut.addToY(maxEdge.v);
    remaining.erase(maxEdge.u);
    remaining.erase(maxEdge.v);
    
    // O(n) iterations of the while loop
    while (!remaining.empty()) {
        std::vector<std::tuple<int, int, bool>> candidates;
        int bestGain = INT_MIN, worstGain = INT_MAX;

        //  O(n) to iterate through remaining nodes
        for (int u : remaining) {
            // O(degree) for each gainToSide calculation
            int gainX = gainToSide(g, u, cut.inY);
            int gainY = gainToSide(g, u, cut.inX);
            int maxGain = std::max(gainX, gainY);
            bool toX = (gainX >= gainY);
            candidates.emplace_back(maxGain, u, toX);
            bestGain = std::max(bestGain, maxGain);
            worstGain = std::min(worstGain, std::min(gainX, gainY));
        }

        //   O(n) to build RCL
        auto [gain, node, assignToX] = selectFromRCL(candidates, worstGain, bestGain, alpha);
        if (assignToX) cut.addToX(node);
        else cut.addToY(node);
        remaining.erase(node);
    }
    return cut;
}

// O(iterations * m) where iterations is the number of improvement rounds, and m is the number of edges.
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
    
    // O(iterations) outer loop
    while (improved) {
        improved = false;
        iterationCount++;
        
        // Shuffle once per iteration for randomness
        // O(n) to shuffle vertices
        std::shuffle(vertices.begin(), vertices.end(), std::default_random_engine(std::random_device{}()));
        
        // First-improvement strategy
        // O(n) to check all vertices
        for (int v : vertices) {
            const int delta = sum_in[v] - sum_out[v];
            if (delta <= 0) continue;

            // Cache current partition
            const bool was_inX = cut.inX[v];
            
            // Flip the vertex
            was_inX ? cut.addToY(v) : cut.addToX(v);
            
            //  O(degree(v)) to update sums for each improvement
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
    // Overall: O(iterations * n * avg_degree) in worst case
    // Since avg_degree = 2m/n, this becomes O(iterations * m)
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

// O(maxIterations * (n² + local_search_iterations * m))
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