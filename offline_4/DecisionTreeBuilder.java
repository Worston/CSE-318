import java.util.*;

public class DecisionTreeBuilder {
    private SplitCriterion splitCriterion;
    private int maxDepthLimit;
    private int minSamplesForSplit;
    
    public DecisionTreeBuilder(SplitCriterion criterion, int maxDepth) {
        this.splitCriterion = criterion;
        this.maxDepthLimit = maxDepth;
        this.minSamplesForSplit = 2; 
    }
    
    public DecisionTreeBuilder(String criterionCode, int maxDepth) {
        this(new SplitCriterion(criterionCode), maxDepth);
    }
    
    public TreeNode buildTree(List<DataSample> trainingSamples) {
        if (trainingSamples == null || trainingSamples.isEmpty()) {
            throw new IllegalArgumentException("Training samples cannot be null or empty");
        }
        
        Set<String> availableFeatures = extractFeatureNames(trainingSamples);
        return constructTreeRecursive(trainingSamples, availableFeatures, 0);
    }
    
    private TreeNode constructTreeRecursive(List<DataSample> samples, Set<String> features, int currentDepth) {
        TreeNode node = new TreeNode();
        node.setNodeDepth(currentDepth);
        node.setSampleCount(samples.size());
        //if all samples have the same class
        Set<String> uniqueClasses = new HashSet<>();
        for (DataSample sample : samples) {
            uniqueClasses.add(sample.getTargetClass());
        }
        if (uniqueClasses.size() == 1) {
            node.setClassLabel(uniqueClasses.iterator().next()); //getting label of that first class(pure)
            node.setLeafNode(true);
            return node;
        }
        if (shouldStopSplitting(samples, features, currentDepth)) {
            node.setClassLabel(findMajorityClass(samples));
            node.setLeafNode(true);
            return node;
        }
        String bestFeature = selectBestFeature(samples, features);
        if (bestFeature == null) {
            node.setClassLabel(findMajorityClass(samples));
            node.setLeafNode(true);
            return node;
        }
        node.setSplitAttribute(bestFeature);
        Map<String, List<DataSample>> partitions = PartitioningUtils.partitionByContinuousFeatureForTreeBuilding(samples, bestFeature);

        // Create child nodes for each partition
        Set<String> remainingFeatures = new HashSet<>(features);
        remainingFeatures.remove(bestFeature);
        
        for (Map.Entry<String, List<DataSample>> entry : partitions.entrySet()) {
            String featureValue = entry.getKey();
            List<DataSample> partition = entry.getValue();
            if (!partition.isEmpty()) {
                TreeNode childNode = constructTreeRecursive(partition, remainingFeatures, currentDepth + 1);
                node.addBranch(featureValue, childNode);
            }
        }
        if (!node.hasChildren()) {
            node.setClassLabel(findMajorityClass(samples));
            node.setLeafNode(true);
        }
        return node;
    }
    
    private boolean shouldStopSplitting(List<DataSample> samples, Set<String> features, int currentDepth) {
        return features.isEmpty() || samples.size() < minSamplesForSplit || (maxDepthLimit > 0 && currentDepth >= maxDepthLimit);
    }
    
    private String selectBestFeature(List<DataSample> samples, Set<String> features) {
        String bestFeature = null;
        double bestScore = -Double.MAX_VALUE;
        for (String feature : features) {
            Map<String, List<DataSample>> testPartitions = PartitioningUtils.partitionByFeature(samples, feature);
            if (testPartitions.size() < 2) {
                continue; // Skip features that don't create splits
            }
            boolean hasValidSplit = false;
            for (List<DataSample> partition : testPartitions.values()) {
                if (partition != null && partition.size() > 0 && partition.size() < samples.size()) {
                    hasValidSplit = true;
                    break;
                }
            }
            if (!hasValidSplit) {
                continue; //Skip features that don't create diverse groups
            }
            double score = splitCriterion.calculateSplitScore(samples, feature);
            if (score > bestScore) {
                bestScore = score;
                bestFeature = feature;
            }
        }
        return bestFeature;
    }
    
    private String findMajorityClass(List<DataSample> samples) {
        Map<String, Integer> classCounts = new HashMap<>();
        for (DataSample sample : samples) {
            String targetClass = sample.getTargetClass();
            classCounts.put(targetClass, classCounts.getOrDefault(targetClass, 0) + 1);
        }
        String majorityClass = "unknown";
        int maxCount = 0;
        for (String className : classCounts.keySet()) {
            int count = classCounts.get(className);
            if (count > maxCount) {
                maxCount = count;
                majorityClass = className;
            }
        }
        return majorityClass;
    }
    
    private Set<String> extractFeatureNames(List<DataSample> samples) {
        if (samples.isEmpty()) return new HashSet<>();
        return new HashSet<>(samples.get(0).getFeatureNames());
    }
    
    public SplitCriterion getSplitCriterion() { return splitCriterion; }
    public int getMaxDepthLimit() { return maxDepthLimit; }
}