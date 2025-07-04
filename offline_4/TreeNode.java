import java.util.Map;
import java.util.HashMap;

public class TreeNode {
    private String splitAttribute;
    private String classLabel;
    private Map<String, TreeNode> branches;
    private boolean isLeafNode;
    private int nodeDepth;
    private int sampleCount;
    
    public TreeNode() {
        this.branches = new HashMap<>();
        this.isLeafNode = false;
        this.nodeDepth = 0;
        this.sampleCount = 0;
    }
    
    public TreeNode(String classLabel) {
        this();
        this.classLabel = classLabel;
        this.isLeafNode = true;
    }
    
    public String getSplitAttribute() { return splitAttribute; }
    public void setSplitAttribute(String splitAttribute) { this.splitAttribute = splitAttribute; }
    public String getClassLabel() { return classLabel; }
    public void setClassLabel(String classLabel) { this.classLabel = classLabel; }
    public Map<String, TreeNode> getBranches() { return branches; }
    public void addBranch(String value, TreeNode child) { branches.put(value, child); }
    public boolean isLeafNode() { return isLeafNode; }
    public void setLeafNode(boolean leafNode) { this.isLeafNode = leafNode; }
    public int getNodeDepth() { return nodeDepth; }
    public void setNodeDepth(int nodeDepth) { this.nodeDepth = nodeDepth; }
    public int getSampleCount() { return sampleCount; }
    public void setSampleCount(int sampleCount) { this.sampleCount = sampleCount; }
    public boolean hasChildren() { return !branches.isEmpty(); }
    public TreeNode getChild(String value) { return branches.get(value); }
    
    @Override
    public String toString() {
        if (isLeafNode) {
            return "Leaf[" + classLabel + "]";
        } else {
            return "Node[" + splitAttribute + "]";
        }
    }
}
