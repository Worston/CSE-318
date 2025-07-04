import java.util.*;
import java.util.stream.Collectors;

public class DecisionTreeBuilder {
    
    private SplitCriterion splitCriterion;
    private int maxDepthLimit;
    private int minSamplesForSplit;
    
    public DecisionTreeBuilder(SplitCriterion criterion, int maxDepth) {
        this.splitCriterion = criterion;
        this.maxDepthLimit = maxDepth;
        this.minSamplesForSplit = 2; // Match demo's minimum sample requirement
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
        
        // Check if all samples have the same class
        Set<String> uniqueClasses = samples.stream()
            .map(DataSample::getTargetClass)
            .collect(Collectors.toSet());
        
        if (uniqueClasses.size() == 1) {
            node.setClassLabel(uniqueClasses.iterator().next());
            node.setLeafNode(true);
            return node;
        }
        
        // Check stopping conditions
        if (shouldStopSplitting(samples, features, currentDepth)) {
            node.setClassLabel(findMajorityClass(samples));
            node.setLeafNode(true);
            return node;
        }
        
        // Find the best feature to split on
        String bestFeature = selectBestFeature(samples, features);
        if (bestFeature == null) {
            node.setClassLabel(findMajorityClass(samples));
            node.setLeafNode(true);
            return node;
        }
        
        node.setSplitAttribute(bestFeature);
        
        Map<String, List<DataSample>> partitions = partitionByFeature(samples, bestFeature);
        
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
        
        // If no valid children were created, make this a leaf
        if (!node.hasChildren()) {
            node.setClassLabel(findMajorityClass(samples));
            node.setLeafNode(true);
        }
        
        return node;
    }
    
    private boolean shouldStopSplitting(List<DataSample> samples, Set<String> features, int currentDepth) {
        return features.isEmpty() || 
               samples.size() < minSamplesForSplit ||
               (maxDepthLimit > 0 && currentDepth >= maxDepthLimit);
    }
    
    private String selectBestFeature(List<DataSample> samples, Set<String> features) {
        String bestFeature = null;
        double bestScore = -Double.MAX_VALUE;
        
        for (String feature : features) {
            // Check if this feature can create meaningful splits
            Map<String, List<DataSample>> testPartitions = partitionByFeature(samples, feature);
            
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
                continue; // Skip features that don't create diverse groups
            }
            
            double score = splitCriterion.calculateSplitScore(samples, feature);
            
            if (score > bestScore) {
                bestScore = score;
                bestFeature = feature;
            }
        }
        
        return bestFeature;
    }
    
    private Map<String, List<DataSample>> partitionByFeature(List<DataSample> samples, String feature) {
        Map<String, List<DataSample>> partitions = new HashMap<>();
        
        // Check if this is a continuous attribute
        if (isContinuousAttribute(samples, feature)) {
            // Handle continuous attributes with demo's interval strategy
            List<Double> values = samples.stream()
                    .map(sample -> {
                        try {
                            String value = sample.getFeatureValue(feature);
                            if (value == null || value.equals("?")) {
                                return Double.NaN; // Handle missing values
                            }
                            return Double.parseDouble(value);
                        } catch (NumberFormatException e) {
                            return Double.NaN; // Handle non-numeric values
                        }
                    })
                    .filter(v -> !Double.isNaN(v))
                    .collect(Collectors.toList());
            
            if (values.isEmpty()) {
                // If no numeric values, treat as categorical
                return partitionByCategoricalFeature(samples, feature);
            }
            
            double min = values.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
            double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            
            // Skip if no variation in values
            if (Math.abs(max - min) < 1e-10) {
                // Treat as categorical if no variation
                return partitionByCategoricalFeature(samples, feature);
            }
            
            // Use demo's unlimited interval calculation strategy for tree building
            int intervals = (int) Math.round((max - min) * 3);
            // Only ensure minimum of 2 intervals, no maximum limit for tree building
            intervals = Math.max(2, intervals);
            double stepSize = (max - min) / intervals;
            
            // Create range buckets similar to demo
            for (double rangeStart = min; rangeStart < max; rangeStart += stepSize) {
                partitions.put(String.valueOf(rangeStart), new ArrayList<>());
            }
            
            // Assign samples to appropriate ranges
            for (DataSample sample : samples) {
                String value = sample.getFeatureValue(feature);
                if (value == null || value.trim().isEmpty() || value.equals("?")) {
                    // Handle missing values
                    if (!partitions.containsKey("?")) {
                        partitions.put("?", new ArrayList<>());
                    }
                    partitions.get("?").add(sample);
                    continue;
                }
                
                try {
                    double numValue = Double.parseDouble(value);
                    
                    // Find the correct range using demo's logic
                    double initRange = min;
                    for (double range = min + stepSize; range <= max; range += stepSize) {
                        if (numValue >= initRange && numValue < range) {
                            break;
                        }
                        initRange = range;
                    }
                    
                    String rangeKey = String.valueOf(initRange);
                    if (partitions.containsKey(rangeKey)) {
                        partitions.get(rangeKey).add(sample);
                    } else {
                        // Edge case - add to last range
                        String lastKey = String.valueOf(min + (intervals - 1) * stepSize);
                        if (partitions.containsKey(lastKey)) {
                            partitions.get(lastKey).add(sample);
                        }
                    }
                } catch (NumberFormatException e) {
                    // Handle non-numeric values as categorical
                    if (!partitions.containsKey(value)) {
                        partitions.put(value, new ArrayList<>());
                    }
                    partitions.get(value).add(sample);
                }
            }
            
            // Remove empty partitions to avoid issues
            partitions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
            
        } else {
            // Handle categorical attributes
            return partitionByCategoricalFeature(samples, feature);
        }
        
        return partitions;
    }
    
    private boolean isContinuousAttribute(List<DataSample> samples, String feature) {
        // Check if most values are numeric with sufficient unique values
        int numericCount = 0;
        int totalCount = 0;
        Set<String> uniqueValues = new HashSet<>();
        
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value != null && !value.trim().isEmpty() && !value.equals("?")) {
                totalCount++;
                uniqueValues.add(value);
                try {
                    Double.parseDouble(value);
                    numericCount++;
                } catch (NumberFormatException e) {
                    // Not numeric
                }
            }
        }
        
        // Consider continuous if:
        // 1. More than 70% of values are numeric
        // 2. Has sufficient unique values to benefit from ranging
        return totalCount > 0 && 
               (double) numericCount / totalCount > 0.7 && 
               uniqueValues.size() > 5;
    }
    
    private Map<String, List<DataSample>> partitionByCategoricalFeature(List<DataSample> samples, String feature) {
        Map<String, List<DataSample>> partitions = new HashMap<>();
        
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value == null || value.trim().isEmpty()) {
                value = "?";
            }
            
            if (!partitions.containsKey(value)) {
                partitions.put(value, new ArrayList<>());
            }
            partitions.get(value).add(sample);
        }
        
        return partitions;
    }
    
    private String findMajorityClass(List<DataSample> samples) {
        Map<String, Integer> classCounts = new HashMap<>();
        for (DataSample sample : samples) {
            String targetClass = sample.getTargetClass();
            classCounts.put(targetClass, classCounts.getOrDefault(targetClass, 0) + 1);
        }
        
        return classCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("unknown");
    }
    
    private Set<String> extractFeatureNames(List<DataSample> samples) {
        if (samples.isEmpty()) return new HashSet<>();
        return new HashSet<>(samples.get(0).getFeatureNames());
    }
    
    public SplitCriterion getSplitCriterion() { return splitCriterion; }
    public int getMaxDepthLimit() { return maxDepthLimit; }
}