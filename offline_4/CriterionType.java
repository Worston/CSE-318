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