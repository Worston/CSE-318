import java.util.Arrays;
import java.util.Random;

public class AdultMain {
    public static void main(String[] args) {
        
        if (args.length < 2) {
            System.out.println("Usage: java AdultMain <criterion> <maxDepth>");
            System.out.println("  criterion: IG, IGR, or NWIG");
            System.out.println("  maxDepth: 0 for no pruning, positive integer for max depth");
            return;
        }
        
        String criterion = args[0];
        int maxDepth;
        
        try {
            maxDepth = Integer.parseInt(args[1]);
        } catch (NumberFormatException e) {
            System.out.println("Error: maxDepth must be a valid integer");
            return;
        }
        
        if (!Arrays.asList("IG", "IGR", "NWIG").contains(criterion)) {
            System.out.println("Error: Invalid criterion. Use IG, IGR, or NWIG");
            return;
        }
        
        try {
            // Load Adult dataset
            DatasetLoader loader = new DatasetLoader();
            DatasetInfo datasetInfo = loader.loadDataset("Datasets/adult.data");
            
            datasetInfo.displayInfo();
            
            // Single training run with detailed logging
            System.out.println("\n" + "=".repeat(50));
            System.out.println("TRAINING DECISION TREE");
            System.out.println("=".repeat(50));
            System.out.println("Criterion: " + criterion);
            System.out.println("Max Depth: " + (maxDepth == 0 ? "unlimited" : maxDepth));
            
            // Split dataset 80/20 with fixed seed for reproducibility
            DatasetSplit split = loader.splitDataset(datasetInfo.getSamples(), 0.8, new Random(42));
            java.util.List<DataSample> trainSet = split.getTrainSet();
            java.util.List<DataSample> testSet = split.getTestSet();
            
            System.out.println("Train size: " + trainSet.size() + " (" + String.format("%.1f", trainSet.size() * 100.0 / datasetInfo.getSamples().size()) + "%)");
            System.out.println("Test size: " + testSet.size() + " (" + String.format("%.1f", testSet.size() * 100.0 / datasetInfo.getSamples().size()) + "%)");
            
            // Train classifier with timing
            DecisionTreeClassifier classifier = new DecisionTreeClassifier(criterion, maxDepth);
            
            long startTime = System.currentTimeMillis();
            classifier.train(trainSet);
            long endTime = System.currentTimeMillis();
            
            System.out.println("Training time: " + (endTime - startTime) + " ms");
            
            // Print tree statistics
            System.out.println("\nTree Statistics:");
            System.out.println("  Total nodes: " + classifier.getTreeSize());
            System.out.println("  Maximum depth: " + classifier.getTreeDepth());
            
            // Test the tree
            System.out.println("\n" + "=".repeat(40));
            System.out.println("TESTING DECISION TREE");
            System.out.println("=".repeat(40));
            
            long testStartTime = System.currentTimeMillis();
            double accuracy = classifier.evaluateAccuracy(testSet);
            long testEndTime = System.currentTimeMillis();
            
            System.out.println("Testing time: " + (testEndTime - testStartTime) + " ms");
            System.out.println("\n" + "=".repeat(40));
            System.out.println("FINAL RESULTS");
            System.out.println("=".repeat(40));
            System.out.println("Correct predictions: " + Math.round(accuracy * testSet.size()) + "/" + testSet.size());
            System.out.println("Accuracy: " + String.format("%.2f%%", accuracy * 100));
            System.out.println("Error rate: " + String.format("%.2f%%", (1 - accuracy) * 100));
            
            // Uncomment these for debugging:
            // classifier.demonstrateTreeConstruction(datasetInfo.getSamples(), "Adult");
            //runner.compareAllCriteria(datasetInfo.getSamples(), maxDepth, "Adult");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
