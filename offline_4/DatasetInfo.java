import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DatasetInfo {
    private String datasetName;
    private List<String> headers;
    private List<DataSample> samples;
    private Map<String, Integer> classDistribution;
    
    public DatasetInfo(String name, List<String> headers, List<DataSample> samples) {
        this.datasetName = name;
        this.headers = new ArrayList<>(headers);
        this.samples = new ArrayList<>(samples);
        this.classDistribution = new HashMap<>();
        
        // Calculate class distribution
        for (DataSample sample : samples) {
            String targetClass = sample.getTargetClass();
            classDistribution.put(targetClass, classDistribution.getOrDefault(targetClass, 0) + 1);
        }
    }
    
    public void displayInfo() {
        System.out.println("=== Dataset: " + datasetName + " ===");
        System.out.println("Total samples: " + samples.size());
        System.out.println("Total features: " + (headers.size() - 1)); // Exclude target column
        //System.out.println("Features: " + headers.subList(0, headers.size() - 1));
        System.out.println("Target column: " + headers.get(headers.size() - 1));
        System.out.println("Class distribution:");
        for (Map.Entry<String, Integer> entry : classDistribution.entrySet()) {
            double percentage = (double) entry.getValue() / samples.size() * 100;
            System.out.printf("  %s: %d (%.1f%%)\n", entry.getKey(), entry.getValue(), percentage);
        }
        System.out.println();
    }
    
    public String getDatasetName() { return datasetName; }
    public List<String> getHeaders() { return headers; }
    public List<DataSample> getSamples() { return samples; }
    public Map<String, Integer> getClassDistribution() { return classDistribution; }
}
