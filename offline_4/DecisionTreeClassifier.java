import java.util.*;

public class DecisionTreeClassifier {
    private TreeNode rootNode;
    private DecisionTreeBuilder treeBuilder;
    
    public DecisionTreeClassifier(String criterionCode, int maxDepth) {
        this.treeBuilder = new DecisionTreeBuilder(criterionCode, maxDepth);
    }
    public DecisionTreeClassifier(SplitCriterion criterion, int maxDepth) {
        this.treeBuilder = new DecisionTreeBuilder(criterion, maxDepth);
    }
    
    public void train(List<DataSample> trainingSamples) {
        if (trainingSamples == null || trainingSamples.isEmpty()) {
            throw new IllegalArgumentException("Training samples cannot be null or empty");
        }
        this.rootNode = treeBuilder.buildTree(trainingSamples);
    }
    
    public String predict(DataSample sample) {
        if (rootNode == null) {
            throw new IllegalStateException("Model has not been trained yet");
        }
        String prediction = traverseTreeForPrediction(rootNode, sample);
        return prediction;
    }
    
    private String traverseTreeForPrediction(TreeNode node, DataSample sample) {
        if (node.isLeafNode()) {
            return node.getClassLabel();
        }
        String featureValue = sample.getFeatureValue(node.getSplitAttribute());
        if (featureValue == null) featureValue = "";  //changed from '?'
        TreeNode childNode = node.getChild(featureValue);
        
        if (childNode == null) {
            // Might be a continuous attribute with range keys
            childNode = findBestRangeChild(node, featureValue);
        }
        
        if (childNode == null) {
            // No child node for this attribute value, return majority class or first available
            if (!node.getBranches().isEmpty()) {
                // Return prediction from first child as fallback
                return traverseTreeForPrediction(node.getBranches().values().iterator().next(), sample);
            }
            return "unknown";
        }
        return traverseTreeForPrediction(childNode, sample);
    }
    
    private TreeNode findBestRangeChild(TreeNode node, String featureValue) {
        try {
            double value = Double.parseDouble(featureValue);
            
            // Find the best matching range key
            String bestRangeKey = null;
            double bestRangeStart = Double.NEGATIVE_INFINITY;
            
            for (String key : node.getBranches().keySet()) {
                try {
                    double rangeStart = Double.parseDouble(key);
                    if (rangeStart <= value && rangeStart > bestRangeStart) {
                        bestRangeStart = rangeStart;
                        bestRangeKey = key;
                    }
                } catch (NumberFormatException e) {
                    // Skip non-numeric keys
                }
            }
            
            return bestRangeKey != null ? node.getChild(bestRangeKey) : null;
        } catch (NumberFormatException e) {
            // Not a numeric value - return null for categorical fallback
            return null;
        }
    }
    
    public double evaluateAccuracy(List<DataSample> testSamples) {
        if (testSamples.isEmpty()) return 0.0;
        
        int correctPredictions = 0;
        
        for (DataSample sample : testSamples) {
            String prediction = predict(sample);
            String actual = sample.getTargetClass();
            
            if (prediction.equals(actual)) {
                correctPredictions++;
            }
            
        }
        
        return (double) correctPredictions / testSamples.size();
    }
    
    public int getTreeSize() {
        return rootNode == null ? 0 : countNodesRecursive(rootNode);
    }
    
    private int countNodesRecursive(TreeNode node) {
        if (node.isLeafNode()) {
            return 1;
        }
        
        int nodeCount = 1;
        for (TreeNode child : node.getBranches().values()) {
            nodeCount += countNodesRecursive(child);
        }
        
        return nodeCount;
    }
    
    public int getTreeDepth() {
        return rootNode == null ? 0 : calculateDepthRecursive(rootNode);
    }
    
    private int calculateDepthRecursive(TreeNode node) {
        if (node.isLeafNode()) {
            return 1;
        }
        
        int maxDepth = 0;
        for (TreeNode child : node.getBranches().values()) {
            maxDepth = Math.max(maxDepth, calculateDepthRecursive(child));
        }
        
        return maxDepth + 1;
    }
    
    public void printTreeStructure() {
        if (rootNode == null) {
            System.out.println("No tree has been built yet");
            return;
        }
        
        System.out.println("Decision Tree Structure:");
        printNodeRecursive(rootNode, "", true);
    }
    
    private void printNodeRecursive(TreeNode node, String prefix, boolean isLast) {
        System.out.println(prefix + (isLast ? "└── " : "├── ") + node.toString());
        
        if (!node.isLeafNode()) {
            List<Map.Entry<String, TreeNode>> children = new ArrayList<>(node.getBranches().entrySet());
            
            for (int i = 0; i < children.size(); i++) {
                Map.Entry<String, TreeNode> entry = children.get(i);
                String value = entry.getKey();
                TreeNode child = entry.getValue();
                
                String childPrefix = prefix + (isLast ? "    " : "│   ");
                System.out.println(childPrefix + "├── " + value + " →");
                
                printNodeRecursive(child, childPrefix, i == children.size() - 1);
            }
        }
    }
    
    public TreeNode getRootNode() { return rootNode; }
    public DecisionTreeBuilder getTreeBuilder() { return treeBuilder; }
}