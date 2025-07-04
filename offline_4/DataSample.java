import java.util.Map;
import java.util.HashMap;
import java.util.Set;

public class DataSample {
    private Map<String, String> featureValues;
    private String targetClass;
    
    public DataSample() {
        this.featureValues = new HashMap<>();
    }
    
    public DataSample(Map<String, String> featureValues, String targetClass) {
        this.featureValues = new HashMap<>(featureValues);
        this.targetClass = targetClass;
    }
    
    public Map<String, String> getFeatureValues() { return featureValues; }
    public void setFeatureValues(Map<String, String> featureValues) { 
        this.featureValues = new HashMap<>(featureValues); 
    }
    
    public String getTargetClass() { return targetClass; }
    public void setTargetClass(String targetClass) { this.targetClass = targetClass; }
    
    public String getFeatureValue(String feature) { return featureValues.get(feature); }
    public void setFeatureValue(String feature, String value) { featureValues.put(feature, value); }
    
    public Set<String> getFeatureNames() { return featureValues.keySet(); }
    
    @Override
    public String toString() {
        return "DataSample{" + featureValues + " -> " + targetClass + "}";
    }
}
