#!/bin/bash

# Compile and run benchmarks
g++ -std=c++17 -O3 -o benchmark Benchmarks.cpp
./benchmark

# Convert results to CSV
python3 convert_to_csv.py

echo "Results saved in 2105015.csv"