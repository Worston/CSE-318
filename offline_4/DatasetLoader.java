import java.io.*;
import java.util.*;

public class DatasetLoader {    
    public DatasetInfo loadDataset(String filePath) throws IOException {
        List<String> headers = new ArrayList<>();
        List<DataSample> samples = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                throw new IOException("File is empty or missing headers");
            }
            
            String[] headerArray = headerLine.split(",");
            for (String header : headerArray) {
                headers.add(header.trim());
            }
            
            // Read data rows
            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                
                if (line.isEmpty()) {
                    continue;
                }
                
                String[] values = line.split(",");
                if (values.length < headers.size()) {
                    continue; 
                }
                
                for (int i = 0; i < values.length; i++) {
                    values[i] = values[i].trim();
                }
                
                // Create feature map (exclude target column and irrelevant features)
                Map<String, String> features = new HashMap<>();
                for (int i = 0; i < headers.size() - 1; i++) {
                    String featureName = headers.get(i);
                    String value = values[i];
                    
                    // Skip irrelevant features but include ALL values (including '?' and empty)
                    // Match demo behavior - keep original values as they are
                    if (!isIrrelevantFeature(featureName)) {
                        features.put(featureName, value);
                    }
                }
                
                String targetClass = values[headers.size() - 1];
                if (!targetClass.trim().isEmpty()) {
                    samples.add(new DataSample(features, targetClass));
                }
            }
        }
        
        String datasetName = extractDatasetName(filePath);
        return new DatasetInfo(datasetName, headers, samples);
    }
    
    private boolean isIrrelevantFeature(String featureName) {
        if (featureName == null) return true;
        
        String lower = featureName.toLowerCase();
        if (lower.equals("id") || 
            lower.equals("index") || 
            lower.equals("row") || 
            lower.equals("record") || 
            lower.equals("number") || 
            lower.equals("no")) {
            return true;
        }
        return false;
    }
    
    private String extractDatasetName(String filePath) {
        String fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    }
    
    public DatasetSplit splitDataset(List<DataSample> samples, double trainRatio, Random random) {
        List<DataSample> shuffledSamples = new ArrayList<>(samples);
        Collections.shuffle(shuffledSamples, random);
        int trainSize = (int) (shuffledSamples.size() * trainRatio);
        List<DataSample> trainSet = shuffledSamples.subList(0, trainSize);
        List<DataSample> testSet = shuffledSamples.subList(trainSize, shuffledSamples.size());
        
        return new DatasetSplit(new ArrayList<>(trainSet), new ArrayList<>(testSet));
    }
}