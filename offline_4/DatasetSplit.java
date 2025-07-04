import java.util.List;

public class DatasetSplit {
    private List<DataSample> trainSet;
    private List<DataSample> testSet;
    
    public DatasetSplit(List<DataSample> trainSet, List<DataSample> testSet) {
        this.trainSet = trainSet;
        this.testSet = testSet;
    }
    
    public List<DataSample> getTrainSet() { return trainSet; }
    public List<DataSample> getTestSet() { return testSet; }
}
