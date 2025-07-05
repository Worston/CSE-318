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
        return totalCount > 0 && (double) numericCount / totalCount > 0.7 && uniqueValues.size() > 10;
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
        
        double min = Collections.min(values);
        double max = Collections.max(values);
        
        if (Math.abs(max - min) < 1e-10) {
            return partitionByCategoricalFeature(samples, feature);
        }
        int intervals;
        if (limitIntervals) {
            //limited intervals (10-100)
            intervals = Math.max(10, Math.min(100, (int) Math.round((max - min) * 3)));
        } else {
            //unlimited intervals
            intervals = Math.max(2, (int) Math.round((max - min) * 3));
            //intervals = Math.max(2, Math.min(100000, (int) Math.round((max - min) * 3)));
        }
        
        double stepSize = (max - min) / intervals;
        List<Double> rangeStarts = new ArrayList<>();
        for (int i = 0; i < intervals; i++) {
            double rangeStart = min + i * stepSize;
            rangeStarts.add(rangeStart);
            partitions.put(String.valueOf(rangeStart), new ArrayList<>());
        }

        // Assign samples to intervals using binary search
        for (DataSample sample : samples) {
            String value = sample.getFeatureValue(feature);
            if (value == null || value.trim().isEmpty() || value.equals("?")) {
                continue;
            }
            try {
                double numValue = Double.parseDouble(value);
                int index = Collections.binarySearch(rangeStarts, numValue);
                String rangeKey;
                if (index >= 0) {
                    // Exact match
                    rangeKey = String.valueOf(rangeStarts.get(index));
                } else {
                    // Insertion point indicates the interval
                    int insertionPoint = -index - 1;
                    if (insertionPoint == 0) {
                        rangeKey = String.valueOf(rangeStarts.get(0));
                    } else if (insertionPoint >= intervals) {
                        rangeKey = String.valueOf(rangeStarts.get(intervals - 1));
                    } else {
                        rangeKey = String.valueOf(rangeStarts.get(insertionPoint - 1));
                    }
                }
                partitions.get(rangeKey).add(sample);
            } catch (NumberFormatException e) {
                // Skip non-numeric values
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
