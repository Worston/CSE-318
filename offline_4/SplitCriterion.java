import java.util.*;

public class SplitCriterion {
    
    public enum CriterionType {
        INFORMATION_GAIN("IG"),
        INFORMATION_GAIN_RATIO("IGR"),
        NORMALIZED_WEIGHTED_INFORMATION_GAIN("NWIG");
        
        private final String code;
        
        CriterionType(String code) {
            this.code = code;
        }
        
        public String getCode() { return code; }
        
        public static CriterionType fromString(String code) {
            for (CriterionType type : values()) {
                if (type.getCode().equals(code)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown criterion: " + code);
        }
    }
    
    private CriterionType criterionType;
    
    public SplitCriterion(CriterionType criterionType) {
        this.criterionType = criterionType;
    }
    
    public SplitCriterion(String criterionCode) {
        this.criterionType = CriterionType.fromString(criterionCode);
    }
    
    public double calculateSplitScore(List<DataSample> samples, String feature) {
        switch (criterionType) {
            case INFORMATION_GAIN:
                return computeInformationGain(samples, feature);
            case INFORMATION_GAIN_RATIO:
                return computeInformationGainRatio(samples, feature);
            case NORMALIZED_WEIGHTED_INFORMATION_GAIN:
                return computeNormalizedWeightedIG(samples, feature);
            default:
                throw new IllegalArgumentException("Unsupported criterion");
        }
    }
    
    private double computeInformationGain(List<DataSample> samples, String feature) {
        double originalEntropy = calculateEntropy(samples);
        Map<String, List<DataSample>> partitions = partitionByFeature(samples, feature);
        
        double weightedEntropy = 0.0;
        int totalSamples = samples.size();
        
        for (List<DataSample> partition : partitions.values()) {
            if (!partition.isEmpty()) {
                double weight = (double) partition.size() / totalSamples;
                weightedEntropy += weight * calculateEntropy(partition);
            }
        }
        
        return originalEntropy - weightedEntropy;
    }
    
    private double computeInformationGainRatio(List<DataSample> samples, String feature) {
        double informationGain = computeInformationGain(samples, feature);
        double intrinsicValue = calculateIntrinsicValue(samples, feature);
        
        return intrinsicValue == 0.0 ? 0.0 : informationGain / intrinsicValue;
    }
    
    private double computeNormalizedWeightedIG(List<DataSample> samples, String feature) {
        double informationGain = computeInformationGain(samples, feature);
        Map<String, List<DataSample>> partitions = partitionByFeature(samples, feature);
        
        int k = partitions.size();
        int datasetSize = samples.size();
        
        if (k <= 1) return 0.0;
        
        double penaltyFactor = 1.0 - (double)(k - 1) / datasetSize;
        double normalizationFactor = Math.log(k + 1) / Math.log(2);
        
        return (informationGain / normalizationFactor) * penaltyFactor;
    }
    
    private double calculateEntropy(List<DataSample> samples) {
        if (samples.isEmpty()) return 0.0;
        
        Map<String, Integer> classCounts = new HashMap<>();
        for (DataSample sample : samples) {
            String targetClass = sample.getTargetClass();
            classCounts.put(targetClass, classCounts.getOrDefault(targetClass, 0) + 1);
        }
        
        double entropy = 0.0;
        int totalSamples = samples.size();
        
        for (int count : classCounts.values()) {
            double probability = (double) count / totalSamples;
            if (probability > 0) {
                entropy -= probability * Math.log(probability) / Math.log(2);
            }
        }
        
        return entropy;
    }
    
    private double calculateIntrinsicValue(List<DataSample> samples, String feature) {
        Map<String, List<DataSample>> partitions = partitionByFeature(samples, feature);
        double intrinsicValue = 0.0;
        int totalSamples = samples.size();
        
        for (List<DataSample> partition : partitions.values()) {
            if (!partition.isEmpty()) {
                double probability = (double) partition.size() / totalSamples;
                intrinsicValue -= probability * Math.log(probability) / Math.log(2);
            }
        }
        
        return intrinsicValue;
    }
    
    private Map<String, List<DataSample>> partitionByFeature(List<DataSample> samples, String feature) {
        Map<String, List<DataSample>> partitions = new HashMap<>();
        
        // Check if this is a continuous attribute (same logic as DecisionTreeBuilder)
        if (isContinuousAttribute(samples, feature)) {
            // Handle continuous attributes with interval strategy
            List<Double> values = samples.stream()
                    .map(sample -> {
                        try {
                            return Double.parseDouble(sample.getFeatureValue(feature));
                        } catch (NumberFormatException e) {
                            return 0.0;
                        }
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            double min = values.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
            double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            
            // Skip if no variation in values
            if (Math.abs(max - min) < 1e-10) {
                return partitionByCategoricalFeature(samples, feature);
            }
            
            // Use same interval calculation as DecisionTreeBuilder
            int intervals = Math.max(2, Math.min(5, (int) Math.round((max - min) * 3)));
            double stepSize = (max - min) / intervals;
            
            // Create range buckets
            for (double rangeStart = min; rangeStart < max; rangeStart += stepSize) {
                partitions.put(String.valueOf(rangeStart), new ArrayList<>());
            }
            
            // Assign samples to appropriate ranges
            for (DataSample sample : samples) {
                String value = sample.getFeatureValue(feature);
                if (value == null || value.trim().isEmpty()) {
                    if (!partitions.containsKey("?")) {
                        partitions.put("?", new ArrayList<>());
                    }
                    partitions.get("?").add(sample);
                    continue;
                }
                
                try {
                    double numValue = Double.parseDouble(value);
                    
                    // Find the correct range
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
                    if (!partitions.containsKey(value)) {
                        partitions.put(value, new ArrayList<>());
                    }
                    partitions.get(value).add(sample);
                }
            }
            
            // Remove empty partitions
            partitions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
            
        } else {
            // Handle categorical attributes
            return partitionByCategoricalFeature(samples, feature);
        }
        
        return partitions;
    }
    
    private boolean isContinuousAttribute(List<DataSample> samples, String feature) {
        // Same logic as DecisionTreeBuilder
        int numericCount = 0;
        int totalCount = 0;
        Set<String> uniqueValues = new HashSet<>();
        
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value != null && !value.trim().isEmpty()) {
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
        
        return totalCount > 0 && 
               (double) numericCount / totalCount > 0.7 && 
               uniqueValues.size() > 5;
    }
    
    private Map<String, List<DataSample>> partitionByCategoricalFeature(List<DataSample> samples, String feature) {
        Map<String, List<DataSample>> partitions = new HashMap<>();
        
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value == null) value = "?";
            
            if (!partitions.containsKey(value)) {
                partitions.put(value, new ArrayList<>());
            }
            partitions.get(value).add(sample);
        }
        
        return partitions;
    }
    
    public CriterionType getCriterionType() { return criterionType; }
    
    @Override
    public String toString() {
        return criterionType.getCode();
    }
}