import java.util.*;

public class SplitCriterion {
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
        Map<String, List<DataSample>> partitions = PartitioningUtils.partitionByContinuousFeatureForScoring(samples, feature);
        
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
        Map<String, List<DataSample>> partitions = PartitioningUtils.partitionByContinuousFeatureForScoring(samples, feature);
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
        Map<String, List<DataSample>> partitions = PartitioningUtils.partitionByContinuousFeatureForScoring(samples, feature);
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

    public CriterionType getCriterionType() { return criterionType; }
    
    @Override
    public String toString() {
        return criterionType.getCode();
    }
}