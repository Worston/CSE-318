#include <bits/stdc++.h>
#include "Algorithms.hpp"

using namespace std;
using namespace std::chrono;
namespace fs = std::filesystem;

struct BenchmarkResult {
    string name;
    int n;
    int m;
    int randomWeight;
    int greedyWeight;
    double semiGreedyAlpha;
    int semiGreedyWeight;
    int localAvgIterations;
    int localAvgWeight;
    int graspBest;
    double totalTime;
};

void runBenchmarks() {
    ofstream output("results.txt");
    output << "Name | n | m | Random | Greedy | SemiGreedy(α) | SGWeight | "
           << "LocalAvgIter | LocalAvg | GRASP(50) | TotalTime(s)\n";

    // random_device rd;
    // mt19937 gen(rd());
    // uniform_real_distribution<double> alphaDist(0.0, 1.0);

    vector<string> testFiles;
    for (const auto& entry : fs::directory_iterator("testcases")) {
        if (entry.path().extension() == ".rud") {
            testFiles.push_back(entry.path().stem().string());
        }
    }
    sort(testFiles.begin(), testFiles.end(), [](const string& a, const string& b) {
        return stoi(a.substr(1)) < stoi(b.substr(1));
    });

    for (const auto& testName : testFiles) {
        string filename = "testcases/" + testName + ".rud";
        
        BenchmarkResult res;
        auto totalStart = high_resolution_clock::now();

        try {
            Graph g = Graph::loadFromFile(filename);
            res.name = testName;
            res.name[0] = toupper(res.name[0]);
            res.n = g.n;
            res.m = g.edges.size();

            // Run all heuristics
            res.randomWeight = averageRandomCutWeight(g,100);
            res.greedyWeight = improvedgreedyCut(g).computeWeight(g);
            res.semiGreedyAlpha = /*alphaDist(gen)*/ 0.85;
            res.semiGreedyWeight = semiGreedyCut(g, res.semiGreedyAlpha).computeWeight(g);
            
            double avgIterations;
            res.localAvgWeight = static_cast<int>(averageLocalSearchFromRandom(g, 20, avgIterations));
            res.localAvgIterations = static_cast<int>(avgIterations);
            
            res.graspBest = grasp(g, /*alphaDist(gen)*/ res.semiGreedyAlpha, 50).computeWeight(g);
            
        } catch (...) {
            cerr << "Failed to load: " << filename << endl;
            continue;
        }

        res.totalTime = duration_cast<milliseconds>(high_resolution_clock::now() - totalStart).count() / 1000.0;

        output << res.name << " | " << res.n << " | " << res.m << " | "
               << res.randomWeight << " | " << res.greedyWeight << " | "
               << res.semiGreedyAlpha << " | " << res.semiGreedyWeight << " | "
               << res.localAvgIterations << " | " << res.localAvgWeight << " | "
               << res.graspBest << " | " << res.totalTime << endl;

        cout << "Processed " << res.name << " | Time: " << res.totalTime << "s\n";
    }
    
    output.close();
}

int main() {
    runBenchmarks();
    return 0;
}