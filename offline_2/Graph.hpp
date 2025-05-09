// Graph.h
#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_set>
#include <set>
#include <utility>

struct Edge {
    int u, v, w;
};

class Graph {
    public:
        int n, m;
        std::vector<Edge> edges;
        std::vector<std::vector<std::pair<int, int>>> adj;

        Graph(int nodes) : n(nodes) {
            adj.resize(n);
        }

        void addEdge(int u, int v, int w) {
            edges.push_back({u, v, w});
            adj[u].emplace_back(v, w);
            adj[v].emplace_back(u, w);
        }

        static Graph loadFromFile(const std::string& filename) {
            std::ifstream fin(filename);
            int n, m;
            fin >> n >> m;
            Graph g(n);
            for (int i = 0; i < m; ++i) {
                int u, v, w;
                fin >> u >> v >> w;
                g.addEdge(u - 1, v - 1, w); // convert to 0-indexed
            }
            return g;
        }

        Edge getHeaviestEdge() const {
            return *std::max_element(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
                return a.w < b.w;
            });
        }
};

class Cut {
    public:
        std::set<int> X;
        std::set<int> Y;
    
        Cut() = default;
        Cut(const std::set<int>& a, const std::set<int>& b) : X(a), Y(b) {}
    
        int computeWeight(const Graph& g) const {
            int total = 0;
            for (int u : X) {
                for (const auto& [v, w] : g.adj[u]) {
                    if (Y.count(v)) {
                        total += w;
                    }
                }
            }
            return total;
        }
};

#endif
