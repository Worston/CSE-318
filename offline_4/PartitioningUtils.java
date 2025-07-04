import java.util.*;
public class PartitioningUtils {
    public static Map<String, List<DataSample>> partitionByFeature(List<DataSample> samples, String feature) {
        if (isContinuousAttribute(samples, feature)) {
            return partitionByContinuousFeature(samples, feature);
        } else {
            return partitionByCategoricalFeature(samples, feature);
        }
    }

    public static boolean isContinuousAttribute(List<DataSample> samples, String feature) {
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
               uniqueValues.size() > 10;
    }

    public static Map<String, List<DataSample>> partitionByContinuousFeatureForTreeBuilding(List<DataSample> samples, String feature) {
        return partitionByContinuousFeatureWithIntervals(samples, feature, false);
    }

    public static Map<String, List<DataSample>> partitionByContinuousFeatureForScoring(List<DataSample> samples, String feature) {
        return partitionByContinuousFeatureWithIntervals(samples, feature, true);
    }
    
    private static Map<String, List<DataSample>> partitionByContinuousFeature(List<DataSample> samples, String feature) {
        return partitionByContinuousFeatureForTreeBuilding(samples, feature);
    }
    
    private static Map<String, List<DataSample>> partitionByContinuousFeatureWithIntervals(List<DataSample> samples, String feature, boolean limitIntervals) {
        Map<String, List<DataSample>> partitions = new HashMap<>();
      
        List<Double> values = new ArrayList<>();
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value != null && !value.trim().isEmpty() && !value.equals("?")) {
                try {
                    double numValue = Double.parseDouble(value);
                    values.add(numValue);
                } catch (NumberFormatException e) {
                    //non-numeric values 
                }
            }
        }
        
        if (values.isEmpty()) {
            return partitionByCategoricalFeature(samples, feature);
        }
        
        double min = Double.MAX_VALUE;
        double max = Double.MIN_VALUE;
        for (Double value : values) {
            if (value < min) min = value;
            if (value > max) max = value;
        }
        
        if (Math.abs(max - min) < 1e-10) {
            return partitionByCategoricalFeature(samples, feature);
        }
        int intervals;
        if (limitIntervals) {
            //limited intervals (2-5)
            intervals = Math.max(2, Math.min(5, (int) Math.round((max - min) * 3)));
        } else {
            //unlimited intervals
            intervals = Math.max(2, (int) Math.round((max - min) * 3));
        }
        
        double stepSize = (max - min) / intervals;
        for (double rangeStart = min; rangeStart < max; rangeStart += stepSize) {
            partitions.put(String.valueOf(rangeStart), new ArrayList<>());
        }
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value == null || value.trim().isEmpty() || value.equals("?")) {
                continue;
            }
            
            try {
                double numValue = Double.parseDouble(value);
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
                    String lastKey = String.valueOf(min + (intervals - 1) * stepSize);
                    if (partitions.containsKey(lastKey)) {
                        partitions.get(lastKey).add(sample);
                    }
                }
            } catch (NumberFormatException e) {
                //Skip non-numeric values
                continue;
            }
        }
        partitions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        
        return partitions;
    }

    public static Map<String, List<DataSample>> partitionByCategoricalFeature(List<DataSample> samples, String feature) {
        Map<String, List<DataSample>> partitions = new HashMap<>();
        
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);

            if (value == null || value.trim().isEmpty()) {
                value = ""; 
            }
            if (!partitions.containsKey(value)) {
                partitions.put(value, new ArrayList<>());
            }
            partitions.get(value).add(sample);
        }
        return partitions;
    }
}
